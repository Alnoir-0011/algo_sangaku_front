import { setSession } from "@/tests/__helpers__/signin";
import {
  test,
  expect,
  http,
  HttpResponse,
  passthrough,
} from "next/experimental/testmode/playwright/msw";

test.describe("/user/sangakus", () => {
  test.describe("before singin", () => {
    test("should not allow me to visit edit profile page", async ({ page }) => {
      await page.goto("/user/profile");
      await expect(page).toHaveURL("/signin");
      const flash = page.getByText("サインインしてください");
      await expect(flash).toBeVisible();
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
          http.patch("http://localhost:3000/api/v1/user/profile", () => {
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
          http.all("*", () => {
            return passthrough();
          }),
        ],
        { scope: "test" }, // or 'worker'
      ],
    });

    test("should allow me to edit profile", async ({ page }) => {
      await setSession(page);
      await page.goto("/user/profile");
      await page
        .getByRole("textbox", { name: "ニックネーム" })
        .fill("changed_name");
      const button = page.getByRole("button", { name: "更新する" });
      await button.click();
      await expect(page).toHaveURL("/");
      const flash = page.getByText("プロフィールを更新しました");
      await expect(flash).toBeVisible();
    });
  });
});
