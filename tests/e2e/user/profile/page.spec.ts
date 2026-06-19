import { setSession } from "@/tests/__helpers__/signin";
import {
  test,
  expect,
  http,
  HttpResponse,
  passthrough,
} from "@/tests/e2e/fixtures.msw";

const apiUrl = process.env.API_URL;

test.describe("/user/profile", () => {
  test.describe("before signin", () => {
    test("should not allow me to visit edit profile page without signing in and redirect to signin", async ({ page }) => {
      await page.goto("/user/profile");
      await expect(page).toHaveURL("/signin");
      const flash = page.getByTestId('flash-message');
      await expect(flash).toBeVisible({ timeout: 10_000 });
      await expect(flash).toContainText("サインインしてください");
      const mainNode = page.getByRole("main");
      const heading = mainNode.getByRole("heading", { name: "サインイン" });
      await expect(heading).toBeVisible();
    });

    test("should allow me to see sign in button in nav after redirect to signin", async ({ page }) => {
      await page.goto("/user/profile");
      await expect(page).toHaveURL("/signin");
      await page.reload();
      const drawer = page.getByRole("navigation");
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

    test("should allow me to toggle show_answer_count switch", async ({ page, msw }) => {
      msw.use(
        http.patch(`${apiUrl}/api/v1/user/profile`, () => {
          return HttpResponse.json({ data: { id: "1" } }, { status: 200 });
        }),
      );

      await setSession(page);
      await page.goto("/user/profile");

      const switchEl = page.getByRole("checkbox", {
        name: "提出した回答数を公開プロフィールに表示する",
      });
      await expect(switchEl).not.toBeChecked({ timeout: 10_000 });
      await switchEl.click();
      await expect(switchEl).toBeChecked({ timeout: 5_000 });
    });

    test("should not allow me to update show_answer_count when API fails", async ({
      page,
      msw,
    }) => {
      msw.use(
        http.patch(`${apiUrl}/api/v1/user/profile`, async ({ request }) => {
          const body = await request.json() as { user: Record<string, unknown> };
          if ("show_answer_count" in body.user) {
            return HttpResponse.json({}, { status: 500 });
          }
          return HttpResponse.json({ data: { id: "1" } }, { status: 200 });
        }),
      );

      await setSession(page);
      await page.goto("/user/profile");

      const switchEl = page.getByRole("checkbox", {
        name: "提出した回答数を公開プロフィールに表示する",
      });
      await switchEl.click();
      // 失敗時は元の状態（false）に戻る
      await expect(switchEl).not.toBeChecked({ timeout: 5_000 });
    });

    test("should allow me to edit profile", async ({ page }) => {
      await setSession(page);
      await page.goto("/user/profile");
      await page
        .getByRole("textbox", { name: "ニックネーム" })
        .fill("changed_name");
      const button = page.getByRole("button", { name: "保存" });
      await button.click();
      await expect(page).toHaveURL("/user/profile");
      const flash = page.getByTestId('flash-message');
      await expect(flash).toBeVisible({ timeout: 10_000 });
      await expect(flash).toContainText("プロフィールを更新しました");
    });

    test("should allow me to see validation error when API returns 400", async ({ page, msw }) => {
      msw.use(
        http.patch(`${apiUrl}/api/v1/user/profile`, () => {
          return HttpResponse.json({
            message: "Bad Request",
            errors: [["nickname", ["は不正な値です"]]],
          }, { status: 400 });
        }),
      );

      await setSession(page);
      await page.goto("/user/profile");
      // required フィールドなので有効な値を入力してサーバー側のバリデーションエラーをテスト
      await page.getByRole("textbox", { name: "ニックネーム" }).fill("invalid_value");
      await page.getByRole("button", { name: "保存" }).click();
      await expect(page.getByLabel("nicknameError")).toBeVisible({ timeout: 10_000 });
      await expect(page.getByLabel("nicknameError")).toHaveText("は不正な値です");
    });
  });
});
