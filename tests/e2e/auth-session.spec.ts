import { test, expect } from "@/tests/e2e/fixtures";
import type { APIResponse } from "@playwright/test";
import { setSession } from "../__helpers__/signin";

const AUTH_COOKIE_NAME = /^(__Secure-)?better-auth\./;

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
  });
});
