import {
  test,
  expect,
  http,
  HttpResponse,
} from "@/tests/e2e/fixtures.msw";
import type { APIResponse } from "@playwright/test";
import { setSession } from "../__helpers__/signin";

const apiUrl = process.env.API_URL;

const SESSION_COOKIE = "authjs.session-token";
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

// 失敗時にトークンの値が出力へ出ないよう、cookie 名だけを返す
const sessionCookieReissues = (response: APIResponse) =>
  response
    .headersArray()
    .filter(({ name }) => name.toLowerCase() === "set-cookie")
    .map(({ value }) => value.split(";")[0].split("="))
    .filter(
      ([cookieName, ...rest]) =>
        cookieName.startsWith(SESSION_COOKIE) && rest.join("=") !== "",
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

      expect(sessionCookieReissues(response)).toEqual([]);
    });

    test("should not allow me to have my session cookie re-issued by an RSC response", async ({
      page,
    }) => {
      const response = await page.request.get("/shrines?_rsc=rsc", {
        headers: { RSC: "1" },
      });

      expect(sessionCookieReissues(response)).toEqual([]);
    });

    test("should not allow me to have my session cookie re-issued by the session check", async ({
      page,
    }) => {
      const response = await page.request.get("/api/auth/session");

      expect(sessionCookieReissues(response)).toEqual([]);
    });

    test("should allow me to stay signed in for up to 7 days after I signed in", async ({
      context,
    }) => {
      const cookies = await context.cookies();
      const session = cookies.find(({ name }) => name === SESSION_COOKIE);

      const remainingSec = (session?.expires ?? 0) - Date.now() / 1000;
      expect(remainingSec).toBeGreaterThan(SESSION_MAX_AGE_SEC - 60);
      expect(remainingSec).toBeLessThanOrEqual(SESSION_MAX_AGE_SEC);
    });

    test("should not allow me to be signed in again by a response that was in flight when I signed out", async ({
      page,
      context,
      msw,
      browserName,
    }) => {
      // route.fulfill が返す Set-Cookie をブラウザが保存するかは、エンジンごとに異なる
      test.skip(browserName !== "chromium", "Chromium でのみ再現を確認する");

      msw.use(
        http.delete(`${apiUrl}/api/v1/authenticate`, () => {
          return HttpResponse.json({}, { status: 200 });
        }),
      );

      // 時間の遅延では窓が狭くて再現しないため、順序で制御する
      let release!: () => void;
      const released = new Promise<void>((resolve) => {
        release = resolve;
      });
      await page.route(/_rsc=in-flight/, async (route) => {
        const response = await route.fetch();
        await released;
        await route.fulfill({ response });
      });

      const inFlight = page.evaluate(() =>
        fetch("/shrines?_rsc=in-flight", {
          headers: { RSC: "1" },
        }).then((response) => response.status),
      );

      await page.evaluate(() => {
        window.confirm = () => true;
      });
      await page.getByRole("button", { name: "サインアウト" }).click();

      await expect
        .poll(async () =>
          (await context.cookies()).some(({ name }) => name === SESSION_COOKIE),
        )
        .toBe(false);

      release();
      await inFlight;

      await expect(page).toHaveURL("/signin", { timeout: 10_000 });
      const cookies = await context.cookies();
      expect(cookies.map(({ name }) => name)).not.toContain(SESSION_COOKIE);
    });
  });
});
