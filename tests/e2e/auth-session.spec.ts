import { test, expect } from "@/tests/e2e/fixtures";
import type { APIResponse } from "@playwright/test";
import { setSession } from "../__helpers__/signin";

const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;
// 時刻のずれと、サインインにかかる時間の余裕
const TOLERANCE_SEC = 120;

const AUTH_COOKIE_NAME = /^(__Secure-)?better-auth\./;
// oauth_state など、サインインの途中だけの cookie は寿命が短い。セッションの cookie だけを見る
const SESSION_COOKIE_NAME = /^(__Secure-)?better-auth\.session_(token|data)$/;

// 失敗時にトークンの値が出力へ出ないよう、cookie 名だけを返す
const authCookieReissues = (response: APIResponse) =>
  response
    .headersArray()
    .filter(({ name }) => name.toLowerCase() === "set-cookie")
    .map(({ value }) => value.split(";")[0].split("="))
    .filter(
      ([cookieName, ...rest]) =>
        AUTH_COOKIE_NAME.test(cookieName) && rest.join("=") !== "",
    )
    .map(([cookieName]) => cookieName);

test.describe("Session cookie", () => {
  test.describe("when signed in", () => {
    test.beforeEach(async ({ page }) => {
      await setSession(page);
    });

    test("should not allow me to have my session cookie re-issued by a page response", async ({
      page,
    }) => {
      const response = await page.request.get("/");

      expect(authCookieReissues(response)).toEqual([]);
    });

    test("should not allow me to have my session cookie re-issued by an RSC response", async ({
      page,
    }) => {
      const response = await page.request.get("/shrines?_rsc=rsc", {
        headers: { RSC: "1" },
      });

      expect(authCookieReissues(response)).toEqual([]);
    });

    test("should not allow me to have my session cookie re-issued by the session check", async ({
      page,
    }) => {
      const response = await page.request.get("/api/auth/get-session");

      expect(authCookieReissues(response)).toEqual([]);
    });

    test("should not allow my access token to be exposed to the browser by the session check", async ({
      page,
    }) => {
      const response = await page.request.get("/api/auth/get-session");

      expect(response.status()).toBe(200);
      expect(await response.text()).not.toContain("dummy_token");
    });

    test("should not allow my access token to be exposed to the browser by a page", async ({
      page,
    }) => {
      const response = await page.request.get("/");

      expect(await response.text()).not.toContain("dummy_token");
    });

    test("should allow my session to be kept in the cookies of the auth library only", async ({
      page,
    }) => {
      const names = (await page.context().cookies()).map(({ name }) => name);

      expect(names.some((name) => SESSION_COOKIE_NAME.test(name))).toBe(true);
      expect(names).not.toContain("rails_session");
    });

    test("should not allow scripts to read my session cookies", async ({
      page,
    }) => {
      const readable = await page.evaluate(() => document.cookie);

      expect(readable).not.toMatch(AUTH_COOKIE_NAME);
    });

    test("should not allow me to update my session through the API", async ({
      page,
      baseURL,
    }) => {
      const response = await page.request.post("/api/auth/update-user", {
        data: { name: "changed" },
        headers: { origin: baseURL! },
      });

      expect(response.status()).toBe(404);
    });

    test("should not allow me to sign in with an ID token that skips the OAuth state", async ({
      page,
      baseURL,
    }) => {
      const response = await page.request.post("/api/auth/sign-in/social", {
        data: { provider: "google", idToken: { token: "leaked-token" } },
        headers: { origin: baseURL! },
      });

      expect(response.status()).toBe(404);
    });

    test("should allow me to stay signed in for up to 7 days after I signed in", async ({
      page,
    }) => {
      const cookies = await page.context().cookies();
      const now = Date.now() / 1000;

      const sessionCookies = cookies.filter(({ name }) =>
        SESSION_COOKIE_NAME.test(name),
      );

      expect(sessionCookies.length).toBeGreaterThan(0);
      for (const cookie of sessionCookies) {
        expect(cookie.expires).toBeGreaterThan(
          now + SESSION_MAX_AGE_SEC - TOLERANCE_SEC,
        );
        expect(cookie.expires).toBeLessThan(
          now + SESSION_MAX_AGE_SEC + TOLERANCE_SEC,
        );
      }
    });
  });
});
