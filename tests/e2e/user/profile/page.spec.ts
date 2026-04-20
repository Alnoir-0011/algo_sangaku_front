import { setSession } from "@/tests/__helpers__/signin";
import {
  test,
  expect,
  http,
  HttpResponse,
  passthrough,
} from "next/experimental/testmode/playwright/msw";

const apiUrl = process.env.API_URL;

test.describe("/user/profile", () => {
  test.describe("before signin", () => {
    test("should not allow me to visit edit profile page", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState();
      await page.goto("/user/profile");
      await expect(page).toHaveURL("/signin");
      const flash = page.locator('[role="alert"]:not([aria-live]):not([aria-atomic])');
      await expect(flash).toBeVisible({ timeout: 10_000 });
      await expect(flash).toContainText("サインインしてください");
      const mainNode = page.locator("main");
      const heading = mainNode.getByRole("heading", { name: "サインイン" });
      await expect(heading).toBeVisible();
      await page.reload();
      const drawer = page.locator("nav");
      const link = drawer.getByRole("button", { name: "サインイン" });
      await expect(link).toBeVisible();
    });
  });

  test.describe("after signin", () => {
    test.use({
      mswHandlers: [
        [
          http.get(`${apiUrl}/api/v1/user/profile`, () => {
            return HttpResponse.json({
              data: {
                id: "1",
                type: "my_profile",
                attributes: {
                  email: "user_1@example.com",
                  nickname: "test nickname",
                  show_answer_count: false,
                  created_at: "2026-01-01T00:00:00.000+09:00",
                  sangaku_count: 0,
                  dedicated_sangaku_count: 0,
                  saved_sangaku_count: 0,
                  answer_count: 0,
                },
              },
            });
          }),
          http.patch(`${apiUrl}/api/v1/user/profile`, () => {
            return HttpResponse.json({
              data: {
                id: "1",
                type: "user",
                attributes: {
                  provider: "google",
                  uid: "dummy_token",
                  name: "test user",
                  email: "user_1@example.com",
                  nickname: "changed_name",
                },
              },
            });
          }),
          http.get(`${apiUrl}/api/v1/user/sangakus/generate_source_usage`, () => {
            return HttpResponse.json({
              used: 0,
              limit: 5,
              remaining: 5,
              reset_at: "2026-01-02T00:00:00.000+09:00",
            });
          }),
          http.all("*", () => {
            return passthrough();
          }),
        ],
        { scope: "test" },
      ],
    });

    test("should allow me to edit profile", async ({ page }) => {
      await setSession(page);
      await page.goto("/user/profile");
      await page.waitForLoadState();
      await page
        .getByRole("textbox", { name: "ニックネーム" })
        .fill("changed_name");
      const button = page.getByRole("button", { name: "保存" });
      await button.click();
      await expect(page).toHaveURL("/user/profile");
      const flash = page.locator('[role="alert"]:not([aria-live]):not([aria-atomic])');
      await expect(flash).toBeVisible({ timeout: 10_000 });
      await expect(flash).toContainText("プロフィールを更新しました");
    });
  });
});
