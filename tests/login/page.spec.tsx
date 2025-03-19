import { test, expect } from "@playwright/test";
import { setSession } from "../__helpers__/login";

const testUser = {
  user: {
    name: "testuser",
    email: "test_user@example.com",
    picture: "https://avatars.githubusercontent.com/u/000000",
    nickname: "test nickname",
  },
  expires: "dummy",
  idToken: "dummy",
};

test.describe("/login", () => {
  test.describe("before login", () => {
    test("has heading", async ({ page }) => {
      await page.goto("/login");
      const heading = page.getByRole("heading", { name: "ログイン" });
      await expect(heading).toBeVisible();
    });
  });

  test.describe("after login", () => {
    test("redirect to root", async ({ browser }) => {
      // firfoxとwebkitではsetSessionが正常に動作しないため一旦無視
      const page = await setSession(browser, testUser);
      await page.goto("/login");
      await expect(page).not.toHaveURL("/login");
      await expect(page).toHaveURL("/");
    });
  });
});
