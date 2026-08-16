import { test, expect } from "@/tests/e2e/fixtures";

/**
 * ガードの遮断挙動を検証する。GUARD_MODE=enforce のサーバー（ポート 4021）に対して実行する。
 *
 * インメモリのカウンタはプロセス内で共有されるため、テストごとに
 * x-forwarded-for で別 IP を名乗ってカウンタを分離する。
 */
const PUBLIC_GET_LIMIT = 60;

test.describe("Middleware guard (enforce)", () => {
  test("should not allow me to reach the app with a malicious user agent", async ({
    request,
  }) => {
    const response = await request.get("/", {
      headers: {
        "user-agent": "curl/8.4.0",
        "x-forwarded-for": "203.0.113.1",
      },
    });

    expect({
      status: response.status(),
      cacheControl: response.headers()["cache-control"],
      body: await response.json(),
    }).toEqual({
      status: 403,
      cacheControl: "no-store",
      body: { error: "forbidden" },
    });
  });

  test("should allow me to browse public pages as an ordinary visitor", async ({
    request,
  }) => {
    const response = await request.get("/", {
      headers: { "x-forwarded-for": "203.0.113.2" },
    });

    // 許可時に残量は返さない。しきい値の逆算とペース調整に使われるため
    expect({
      status: response.status(),
      limit: response.headers()["ratelimit-limit"],
    }).toEqual({ status: 200, limit: undefined });
  });

  test("should not allow me to burst past the public page rate limit", async ({
    request,
  }) => {
    const headers = { "x-forwarded-for": "203.0.113.3" };

    const responses = await Promise.all(
      Array.from({ length: PUBLIC_GET_LIMIT + 5 }, () =>
        request.get("/", { headers }),
      ),
    );
    const throttled = responses.filter((response) => response.status() === 429);

    expect(throttled.length).toBeGreaterThan(0);
  });

  test("should allow me to read the retry hint when I am throttled", async ({
    request,
  }) => {
    const headers = { "x-forwarded-for": "203.0.113.4" };
    await Promise.all(
      Array.from({ length: PUBLIC_GET_LIMIT + 5 }, () =>
        request.get("/", { headers }),
      ),
    );

    const response = await request.get("/", { headers });

    expect({
      status: response.status(),
      cacheControl: response.headers()["cache-control"],
      hasRetryAfter: response.headers()["retry-after"] !== undefined,
      body: await response.json(),
    }).toEqual({
      status: 429,
      cacheControl: "no-store",
      hasRetryAfter: true,
      body: { error: "rate_limited" },
    });
  });

  test("should not allow me to affect another visitor's budget", async ({
    request,
  }) => {
    await Promise.all(
      Array.from({ length: PUBLIC_GET_LIMIT + 5 }, () =>
        request.get("/", { headers: { "x-forwarded-for": "203.0.113.5" } }),
      ),
    );

    const other = await request.get("/", {
      headers: { "x-forwarded-for": "203.0.113.6" },
    });

    expect(other.status()).toBe(200);
  });

  test("should not allow me to reset my budget by forging cf-connecting-ip", async ({
    request,
  }) => {
    // Cloudflare を経由しない構成では、このヘッダーは攻撃者が自由に名乗れる。
    // 採用していると 1 リクエストごとに新しいカウンタになり制限が無意味になる
    const headers = { "x-forwarded-for": "203.0.113.20" };

    const responses = await Promise.all(
      Array.from({ length: PUBLIC_GET_LIMIT + 5 }, (_, index) =>
        request.get("/", {
          headers: { ...headers, "cf-connecting-ip": `10.0.0.${index}` },
        }),
      ),
    );
    const throttled = responses.filter((response) => response.status() === 429);

    expect(throttled.length).toBeGreaterThan(0);
  });

  test("should not allow me to escape the rate limit with an unusual method", async ({
    request,
  }) => {
    // PUT でもページはフルレンダリングされるため、数えないと無課金で回せてしまう
    const headers = { "x-forwarded-for": "203.0.113.21" };

    const responses = await Promise.all(
      Array.from({ length: 25 }, () => request.put("/", { headers })),
    );
    const throttled = responses.filter((response) => response.status() === 429);

    expect(throttled.length).toBeGreaterThan(0);
  });

  test("should not allow me to relax the sign-in limit with a next-action header", async ({
    request,
  }) => {
    // next-action を付けるだけで signin(10/分) が server-action(20/分) に
    // 格上げされてはならない
    const headers = {
      "x-forwarded-for": "203.0.113.22",
      "next-action": "forged",
    };

    const responses = await Promise.all(
      Array.from({ length: 15 }, () =>
        request.post("/api/auth/callback/credentials", { headers }),
      ),
    );
    const throttled = responses.filter((response) => response.status() === 429);

    expect(throttled.length).toBeGreaterThan(0);
  });

  test("should not allow me to bypass the guard with a dotted path", async ({
    request,
  }) => {
    // 動的セグメントはドットを含む値にもマッチする。matcher が拡張子で
    // 除外していると middleware ごとスキップされ、ガードも認証も効かなくなる
    const response = await request.get("/profiles/abc.png", {
      headers: {
        "user-agent": "curl/8.4.0",
        "x-forwarded-for": "203.0.113.23",
      },
    });

    expect(response.status()).toBe(403);
  });

  test("should allow me to crawl public pages as a verified crawler", async ({
    request,
  }) => {
    const response = await request.get("/", {
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "x-forwarded-for": "203.0.113.7",
      },
    });

    expect(response.status()).toBe(200);
  });

  test("should not allow me to see the app break when a server action is throttled", async ({
    page,
  }) => {
    // Server Action への 429 でクライアントが unhandled error を起こさないことを確認する
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await page.goto("/");
    const throttled = await page.evaluate(async () => {
      const statuses: number[] = [];
      for (let i = 0; i < 25; i += 1) {
        const response = await fetch("/", {
          method: "POST",
          headers: { "next-action": "e2e-guard-probe" },
        });
        statuses.push(response.status);
      }
      return statuses;
    });

    expect({
      throttled: throttled.includes(429),
      pageErrors,
    }).toEqual({ throttled: true, pageErrors: [] });
  });
});
