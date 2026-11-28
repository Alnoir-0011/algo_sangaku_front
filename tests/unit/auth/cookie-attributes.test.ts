import { describe, test, expect, vi } from "vitest";

// beforeEach では設定しない。auth.ts は import の時点で、環境変数から設定を作る。
// https の公開 URL（本番相当）で用意する
vi.hoisted(() => {
  process.env.BETTER_AUTH_SECRET = "test-secret-for-cookie-attributes-01234";
  process.env.BETTER_AUTH_URL = "https://app.example.com";
  process.env.AUTH_GOOGLE_ID = "google-client-id";
  process.env.AUTH_GOOGLE_SECRET = "google-client-secret";
  process.env.API_URL = "http://api.test";
});

const { serverFetchMock } = vi.hoisted(() => ({ serverFetchMock: vi.fn() }));

vi.mock("@/app/lib/server-fetch", () => ({ serverFetch: serverFetchMock }));
vi.mock("@/app/lib/set-flash", () => ({ setFlash: vi.fn() }));

import { auth } from "@/auth";
import { createAuthKit } from "@/tests/unit/auth/support";

const { signIn } = createAuthKit(auth, serverFetchMock, "https://app.example.com");

const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60;

// 設定値（authCookies）を見るだけだと、発行の経路（setSessionCookie の overrides など）で
// 属性が変わっても、気づけない。実際にサインインして、応答の Set-Cookie を確かめる
// https での認証ライブラリの Cookie
describe("cookies of the auth library on https", () => {
  const setCookieOf = async (name: string) => {
    const { response } = await signIn("my-token");
    return response.headers
      .getSetCookie()
      .find((setCookie) => setCookie.startsWith(`__Secure-better-auth.${name}=`));
  };

  // スクリプトや他のサイトが、Cookie（%s）を使えない
  test.each(["session_token", "session_data"])(
    "should not allow scripts or other sites to use my cookie (%s)",
    async (name) => {
      const setCookie = await setCookieOf(name);

      expect(setCookie).toMatch(/;\s*Secure/i);
      expect(setCookie).toMatch(/;\s*HttpOnly/i);
      expect(setCookie).toMatch(/;\s*SameSite=Lax/i);
    },
  );

  // Cookie（%s）は 7 日間だけ有効で、それより長くは続かない
  test.each(["session_token", "session_data"])(
    "should allow my cookie (%s) to last for 7 days and no longer",
    async (name) => {
      const maxAge = Number((await setCookieOf(name))?.match(/Max-Age=(\d+)/i)?.[1]);

      expect(maxAge).toBeLessThanOrEqual(SEVEN_DAYS_SECONDS);
      expect(maxAge).toBeGreaterThan(SEVEN_DAYS_SECONDS - 60);
    },
  );
});
