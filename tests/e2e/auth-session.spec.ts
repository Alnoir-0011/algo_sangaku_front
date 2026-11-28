import { test, expect } from "@/tests/e2e/fixtures";
import type { APIResponse } from "@playwright/test";
import { setSession } from "../__helpers__/signin";
import { DEFAULT_ACCESS_TOKEN } from "../__helpers__/test-auth";

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

const NOT_FOUND = { message: "Not found" };

// セッション cookie
test.describe("Session cookie", () => {
  // サインイン済みのとき
  test.describe("when signed in", () => {
    test.beforeEach(async ({ page }) => {
      await setSession(page);
    });

    // サインイン済みと認識される
    test("should allow me to be recognized as signed in", async ({ page }) => {
      const response = await page.request.get("/api/auth/get-session");

      expect(response.status()).toBe(200);
      expect((await response.json()).user).toMatchObject({
        nickname: "test_nickname",
        role: "general",
      });
    });

    // ページのレスポンスで、セッション cookie が再発行されない
    test("should not allow me to have my session cookie re-issued by a page response", async ({
      page,
    }) => {
      const response = await page.request.get("/");

      expect(response.status()).toBe(200);
      expect(authCookieReissues(response)).toEqual([]);
    });

    // RSC のレスポンスで、セッション cookie が再発行されない
    test("should not allow me to have my session cookie re-issued by an RSC response", async ({
      page,
    }) => {
      const response = await page.request.get("/shrines?_rsc=rsc", {
        headers: { RSC: "1" },
      });

      expect(response.status()).toBe(200);
      expect(authCookieReissues(response)).toEqual([]);
    });

    // セッション確認で、セッション cookie が再発行されない
    test("should not allow me to have my session cookie re-issued by the session check", async ({
      page,
    }) => {
      const response = await page.request.get("/api/auth/get-session");

      expect(response.status()).toBe(200);
      expect(authCookieReissues(response)).toEqual([]);
    });

    // セッション確認で、アクセストークンがブラウザに露出しない
    test("should not allow my access token to be exposed to the browser by the session check", async ({
      page,
    }) => {
      const response = await page.request.get("/api/auth/get-session");

      expect(response.status()).toBe(200);
      expect(await response.text()).not.toContain(DEFAULT_ACCESS_TOKEN);
    });

    // ページで、アクセストークンがブラウザに露出しない
    test("should not allow my access token to be exposed to the browser by a page", async ({
      page,
    }) => {
      const response = await page.request.get("/");

      expect(response.status()).toBe(200);
      expect(await response.text()).not.toContain(DEFAULT_ACCESS_TOKEN);
    });

    // API 経由でセッションを更新できない
    test("should not allow me to update my session through the API", async ({
      page,
      baseURL,
    }) => {
      const before = await (await page.request.get("/api/auth/get-session")).json();

      const response = await page.request.post("/api/auth/update-user", {
        data: { name: "changed" },
        headers: { origin: baseURL! },
      });

      expect(response.status()).toBe(404);
      expect(await response.json()).toMatchObject(NOT_FOUND);
      const after = await (await page.request.get("/api/auth/get-session")).json();
      expect(after.user.name).toBe(before.user.name);
    });
  });

  // 攻撃者は、通常、サインインしていない
  // サインアウト状態のとき
  test.describe("when signed out", () => {
    // API 経由でセッションを更新できない
    test("should not allow me to update a session through the API", async ({
      request,
      baseURL,
    }) => {
      const response = await request.post("/api/auth/update-user", {
        data: { name: "changed" },
        headers: { origin: baseURL! },
      });

      expect(response.status()).toBe(404);
      expect(await response.json()).toMatchObject(NOT_FOUND);
    });

    // OAuth の state を省略した ID トークンでサインインできない
    test("should not allow me to sign in with an ID token that skips the OAuth state", async ({
      request,
      baseURL,
    }) => {
      const response = await request.post("/api/auth/sign-in/social", {
        data: { provider: "google", idToken: { token: "leaked-token" } },
        headers: { origin: baseURL! },
      });

      expect(response.status()).toBe(404);
      expect(await response.json()).toMatchObject(NOT_FOUND);
      expect(authCookieReissues(response)).toEqual([]);
    });
  });
});
