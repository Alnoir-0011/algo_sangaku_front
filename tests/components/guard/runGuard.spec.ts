import { test, expect } from "@playwright/experimental-ct-react";
import { runGuard, RATE_LIMIT_BUCKETS } from "@/app/lib/guard";
import { createMemoryLimiter, type Limiter } from "@/app/lib/guard/ratelimit";

const NOW = 1_700_000_000_000;
const CHROME_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const GOOGLEBOT_UA =
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const AHREFS_UA =
  "Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)";

/** 呼び出し回数を数えられる limiter を作る */
function createSpyLimiter(inner: Limiter) {
  const calls: string[] = [];
  return {
    calls,
    limiter: {
      limit: (key: string, now?: number) => {
        calls.push(key);
        return inner.limit(key, now);
      },
    } satisfies Limiter,
  };
}

function publicGet(userAgent = CHROME_UA) {
  return {
    method: "GET",
    pathname: "/shrines",
    headers: new Headers({
      "user-agent": userAgent,
      "x-forwarded-for": "198.51.100.20",
    }),
  };
}

function serverAction(userAgent = CHROME_UA) {
  return {
    method: "POST",
    pathname: "/sangakus/1",
    headers: new Headers({
      "user-agent": userAgent,
      "x-forwarded-for": "198.51.100.20",
      "next-action": "7f9a0c1b2d",
    }),
  };
}

test.describe("runGuard", () => {
  test("should not allow me to see any evaluation happen while the guard is off", async () => {
    // Arrange
    const spy = createSpyLimiter(createMemoryLimiter({ limit: 1, windowMs: 60_000 }));

    // Act
    const decision = await runGuard(serverAction("curl/8.4.0"), {
      mode: "off",
      email: null,
      getLimiter: () => spy.limiter,
      now: NOW,
    });

    // Assert
    expect({ action: decision.action, storeCalls: spy.calls.length }).toEqual({
      action: "allow",
      storeCalls: 0,
    });
  });

  test("should not allow me to reach the app with a malicious user agent", async () => {
    // Arrange
    const request = publicGet("curl/8.4.0");

    // Act
    const decision = await runGuard(request, {
      mode: "enforce",
      email: null,
      getLimiter: () => createMemoryLimiter({ limit: 60, windowMs: 60_000 }),
      now: NOW,
    });

    // Assert
    expect({
      action: decision.action,
      status: decision.status,
      reason: decision.reason,
    }).toEqual({ action: "block", status: 403, reason: "bot-ua" });
  });

  test("should allow me to crawl a public page as a verified crawler", async () => {
    // Arrange
    const request = publicGet(GOOGLEBOT_UA);

    // Act
    const decision = await runGuard(request, {
      mode: "enforce",
      email: null,
      getLimiter: () => createMemoryLimiter({ limit: 60, windowMs: 60_000 }),
      now: NOW,
    });

    // Assert
    expect(decision.action).toBe("allow");
  });

  test("should not allow me to invoke a server action as a verified crawler", async () => {
    // Arrange
    const request = serverAction(GOOGLEBOT_UA);

    // Act
    const decision = await runGuard(request, {
      mode: "enforce",
      email: null,
      getLimiter: () => createMemoryLimiter({ limit: 20, windowMs: 60_000 }),
      now: NOW,
    });

    // Assert
    expect({
      action: decision.action,
      status: decision.status,
      reason: decision.reason,
    }).toEqual({ action: "block", status: 403, reason: "crawler-scope" });
  });

  test("should not allow me to invoke a server action as an seo crawler", async () => {
    // Arrange
    const request = serverAction(AHREFS_UA);

    // Act
    const decision = await runGuard(request, {
      mode: "enforce",
      email: null,
      getLimiter: () => createMemoryLimiter({ limit: 20, windowMs: 60_000 }),
      now: NOW,
    });

    // Assert
    expect({
      action: decision.action,
      reason: decision.reason,
    }).toEqual({ action: "block", reason: "crawler-scope" });
  });

  test("should not allow me to skip the rate limit by claiming to be a prefetch", async () => {
    // Arrange
    // Next.js は middleware の手前で Next-Router-Prefetch を削除するため、
    // このヘッダーを見て除外する分岐は本番で成立しない。仮に届いたとしても
    // 予算を消費しないと回避経路になるため、必ず数える
    const spy = createSpyLimiter(createMemoryLimiter({ limit: 60, windowMs: 60_000 }));
    const request = publicGet();
    request.headers.set("Next-Router-Prefetch", "1");

    // Act
    await runGuard(request, {
      mode: "enforce",
      email: null,
      getLimiter: () => spy.limiter,
      now: NOW,
    });

    // Assert
    expect(spy.calls).toHaveLength(1);
  });

  test("should not allow me to skip the rate limit with an unusual method", async () => {
    // Arrange
    const spy = createSpyLimiter(createMemoryLimiter({ limit: 60, windowMs: 60_000 }));
    const request = {
      method: "DELETE",
      pathname: "/sangakus/1",
      headers: new Headers({
        "user-agent": CHROME_UA,
        "x-forwarded-for": "198.51.100.20",
      }),
    };

    // Act
    await runGuard(request, {
      mode: "enforce",
      email: null,
      getLimiter: () => spy.limiter,
      now: NOW,
    });

    // Assert
    expect(spy.calls).toEqual(["guard:server-action:ip:198.51.100.20"]);
  });

  test("should allow me to keep browsing when the guard itself throws", async () => {
    // Arrange
    // fail-open を Upstash 呼び出しの例外（checkLimit が捕捉する）だけでなく、
    // 判定処理そのものにも効かせる。ここで例外が漏れると middleware ごと
    // 500 になり全リクエストが落ちる
    const getLimiter = (): Limiter => {
      throw new Error("failed to construct the limiter");
    };

    // Act
    const decision = await runGuard(publicGet(), {
      mode: "enforce",
      email: null,
      getLimiter,
      now: NOW,
    });

    // Assert
    expect({ action: decision.action, reason: decision.reason }).toEqual({
      action: "allow",
      reason: "guard-error",
    });
  });

  test("should allow me to see the rate limit budget on an allowed request", async () => {
    // Arrange
    const request = publicGet();

    // Act
    const decision = await runGuard(request, {
      mode: "enforce",
      email: null,
      getLimiter: () => createMemoryLimiter({ limit: 60, windowMs: 60_000 }),
      now: NOW,
    });

    // Assert
    expect({
      limit: decision.limit,
      remaining: decision.remaining,
      resetSec: decision.resetSec,
    }).toEqual({ limit: 60, remaining: 59, resetSec: 60 });
  });

  test("should not allow me to exceed the rate limit for my ip", async () => {
    // Arrange
    const limiter = createMemoryLimiter({ limit: 1, windowMs: 60_000 });
    const options = {
      mode: "enforce" as const,
      email: null,
      getLimiter: () => limiter,
      now: NOW,
    };
    await runGuard(publicGet(), options);

    // Act
    const decision = await runGuard(publicGet(), options);

    // Assert
    expect({
      action: decision.action,
      status: decision.status,
      reason: decision.reason,
    }).toEqual({ action: "block", status: 429, reason: "rate-limited" });
  });

  test("should allow me to keep browsing while the rate limit store is down", async () => {
    // Arrange
    const brokenLimiter: Limiter = {
      limit: () => Promise.reject(new Error("upstash unreachable")),
    };

    // Act
    const decision = await runGuard(publicGet(), {
      mode: "enforce",
      email: null,
      getLimiter: () => brokenLimiter,
      now: NOW,
    });

    // Assert
    expect({
      action: decision.action,
      unavailable: decision.unavailable,
    }).toEqual({ action: "allow", unavailable: true });
  });

  test("should allow me to be counted by my account rather than my ip when signed in", async () => {
    // Arrange
    const spy = createSpyLimiter(createMemoryLimiter({ limit: 20, windowMs: 60_000 }));

    // Act
    await runGuard(serverAction(), {
      mode: "enforce",
      email: "user@example.com",
      getLimiter: () => spy.limiter,
      now: NOW,
    });

    // Assert
    expect(spy.calls[0]).toMatch(/^guard:server-action:user:[0-9a-f]{32}$/);
  });

  test("should allow me to see the same verdict in shadow mode as in enforce mode", async () => {
    // Arrange
    const request = publicGet("curl/8.4.0");

    // Act
    const decision = await runGuard(request, {
      mode: "shadow",
      email: null,
      getLimiter: () => createMemoryLimiter({ limit: 60, windowMs: 60_000 }),
      now: NOW,
    });

    // Assert
    expect({
      mode: decision.mode,
      action: decision.action,
      reason: decision.reason,
    }).toEqual({ mode: "shadow", action: "block", reason: "bot-ua" });
  });
});

test.describe("RATE_LIMIT_BUCKETS", () => {
  test("should allow me to read the thresholds defined in the spec", () => {
    // Arrange & Act
    const buckets = RATE_LIMIT_BUCKETS;

    // Assert
    expect(buckets).toEqual({
      "server-action": { limit: 20, windowMs: 60_000 },
      signin: { limit: 10, windowMs: 60_000 },
      "public-get": { limit: 60, windowMs: 60_000 },
    });
  });
});
