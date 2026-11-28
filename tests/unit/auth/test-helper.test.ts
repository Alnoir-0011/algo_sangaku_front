import { describe, test, expect, vi, afterEach } from "vitest";

// beforeEach では設定しない。auth.ts は import の時点で、環境変数から設定を作るため
vi.hoisted(() => {
  process.env.BETTER_AUTH_SECRET = "test-secret-for-test-auth-0123456789abcd";
  process.env.BETTER_AUTH_URL = "http://localhost:4020";
  process.env.AUTH_GOOGLE_ID = "google-client-id";
  process.env.AUTH_GOOGLE_SECRET = "google-client-secret";
  process.env.API_URL = "http://api.test";
});

vi.mock("@/app/lib/server-fetch", () => ({ serverFetch: vi.fn() }));
vi.mock("@/app/lib/set-flash", () => ({ setFlash: vi.fn() }));

import { auth } from "@/auth";
import { railsUserOf } from "@/app/lib/rails-user";
import {
  createSessionCookies,
  getTestAuth,
} from "@/tests/__helpers__/test-auth";

const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60;

type Cookies = Awaited<ReturnType<typeof createSessionCookies>>;

const cookieHeader = (cookies: Cookies) =>
  cookies.map(({ name, value }) => `${name}=${value}`).join("; ");

const sessionOf = (cookies: Cookies) =>
  auth.api.getSession({ headers: new Headers({ cookie: cookieHeader(cookies) }) });

// E2E は、このヘルパーが作った cookie だけで、サーバー（auth.ts）にログインする。
// 食い違いは、ビルド済みの E2E 全体でしか分からないため、ここで確かめる
describe("cookies that the test helper creates", () => {
  test("should allow the server to read my access token, nickname and role", async () => {
    const cookies = await createSessionCookies({ email: "me@example.com" });

    const session = await sessionOf(cookies);

    expect(session?.user.email).toBe("me@example.com");
    expect(railsUserOf(session)).toEqual({
      accessToken: "dummy_token",
      nickname: "test_nickname",
      role: "general",
    });
  });

  test("should allow an admin to be told from a general user", async () => {
    const cookies = await createSessionCookies({
      email: "admin@example.com",
      role: "admin",
    });

    expect(railsUserOf(await sessionOf(cookies))?.role).toBe("admin");
  });

  test("should not allow the cookies of two people to be mixed", async () => {
    const first = await createSessionCookies({
      email: "first@example.com",
      accessToken: "token-of-first",
    });
    const second = await createSessionCookies({
      email: "second@example.com",
      accessToken: "token-of-second",
    });

    const [a, b] = await Promise.all([sessionOf(first), sessionOf(second)]);

    expect([a?.user.email, railsUserOf(a)?.accessToken]).toEqual([
      "first@example.com",
      "token-of-first",
    ]);
    expect([b?.user.email, railsUserOf(b)?.accessToken]).toEqual([
      "second@example.com",
      "token-of-second",
    ]);
  });

  test("should allow the browser to know who I am without my access token", async () => {
    const cookies = await createSessionCookies({
      email: "me@example.com",
      accessToken: "SECRET-TOKEN",
    });

    const response = await auth.handler(
      new Request("http://localhost:4020/api/auth/get-session", {
        headers: { cookie: cookieHeader(cookies) },
      }),
    );
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain("me@example.com");
    expect(body).not.toContain("SECRET-TOKEN");
  });

  test("should not allow the session of the cookies to outlive 7 days", async () => {
    const cookies = await createSessionCookies({ email: "me@example.com" });

    const now = Date.now() / 1000;
    for (const { expires } of cookies) {
      expect(expires).toBeGreaterThan(now + SEVEN_DAYS_SECONDS - 120);
      expect(expires).toBeLessThan(now + SEVEN_DAYS_SECONDS + 120);
    }
  });
});

describe("the auth for tests and the auth of the server", () => {
  test.each(["sessionToken", "sessionData"] as const)(
    "should allow the cookie of %s from the helper to be accepted by the server",
    async (key) => {
      const [testContext, serverContext] = await Promise.all([
        getTestAuth().$context,
        auth.$context,
      ]);

      expect(testContext.authCookies[key]).toEqual(serverContext.authCookies[key]);
    },
  );

  test("should not allow the test utilities to be part of the auth of the server", () => {
    const idsOf = (instance: { options: { plugins?: { id: string }[] } }) =>
      instance.options.plugins?.map((plugin) => plugin.id) ?? [];

    expect(idsOf(getTestAuth())).toContain("test-utils");
    expect(idsOf(auth)).not.toContain("test-utils");
  });
});

describe("the settings of the auth for tests", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  // 設定の無い環境でも、テストの一覧を出せるよう、読み込みの時点では設定を読まない
  test("should allow me to list the tests without the settings", async () => {
    vi.stubEnv("BETTER_AUTH_SECRET", "");
    vi.stubEnv("AUTH_SECRET", "");
    vi.stubEnv("BETTER_AUTH_URL", "");
    vi.resetModules();

    await expect(
      import("@/tests/__helpers__/test-auth"),
    ).resolves.toHaveProperty("createSessionCookies");
  });

  test.each([
    ["the secret", { BETTER_AUTH_SECRET: "", AUTH_SECRET: "" }],
    ["the base URL", { BETTER_AUTH_URL: "" }],
  ])("should not allow cookies to be created without %s", async (_label, env) => {
    for (const [name, value] of Object.entries(env)) vi.stubEnv(name, value);
    vi.resetModules();
    const helper = await import("@/tests/__helpers__/test-auth");

    expect(() => helper.getTestAuth()).toThrow("サーバーと同じ値");
  });
});
