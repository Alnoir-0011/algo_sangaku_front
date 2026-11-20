import { describe, test, expect, vi } from "vitest";

// auth.ts は読み込み時に、環境変数から設定を作る。https の公開 URL（本番相当）で、
// email / password のサインアップができるテスト環境にして、import より前に用意する
vi.hoisted(() => {
  process.env.BETTER_AUTH_SECRET = "test-secret-for-cookie-attributes-01234";
  process.env.BETTER_AUTH_URL = "https://app.example.com";
  process.env.AUTH_GOOGLE_ID = "google-client-id";
  process.env.AUTH_GOOGLE_SECRET = "google-client-secret";
  process.env.API_URL = "http://api.test";
  process.env.APP_ENV = "test";
});

vi.mock("@/app/lib/server-fetch", () => ({ serverFetch: vi.fn() }));
vi.mock("@/app/lib/set-flash", () => ({ setFlash: vi.fn() }));

import { auth } from "@/auth";

describe("cookies of the auth library on https", () => {
  let count = 0;

  // メモリアダプターは、同じメールの 2 回目のサインアップを拒否する
  const signUp = async () => {
    const response = await auth.api.signUpEmail({
      body: {
        email: `me${count++}@example.com`,
        password: "password",
        name: "Me",
        railsAccessToken: "dummy_token",
        nickname: "nick",
        role: "general",
      },
      asResponse: true,
    });
    return response.headers.getSetCookie();
  };

  test.each(["session_token", "session_data"])(
    "should not allow scripts or other sites to use %s",
    async (name) => {
      const setCookie = (await signUp()).find((cookie) =>
        cookie.startsWith(`__Secure-better-auth.${name}=`),
      );

      expect(setCookie).toBeDefined();
      expect(setCookie).toMatch(/;\s*Secure/i);
      expect(setCookie).toMatch(/;\s*HttpOnly/i);
      expect(setCookie).toMatch(/;\s*SameSite=Lax/i);
    },
  );

  test("should not allow my session to outlive 7 days in the browser", async () => {
    const cookies = await signUp();

    for (const name of ["session_token", "session_data"]) {
      const setCookie = cookies.find((cookie) =>
        cookie.startsWith(`__Secure-better-auth.${name}=`),
      );
      const maxAge = Number(setCookie?.match(/Max-Age=(\d+)/i)?.[1]);
      expect(maxAge).toBeLessThanOrEqual(7 * 24 * 60 * 60);
      expect(maxAge).toBeGreaterThan(7 * 24 * 60 * 60 - 60);
    }
  });
});
