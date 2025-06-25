import { test, expect } from "@playwright/test";
import { setSession } from "../__helpers__/login";

test.describe("/login", () => {
  test.describe("before login", () => {
    test("has heading", async ({ page }) => {
      await page.goto("/login");
      const heading = page.getByRole("heading", { name: "ログイン" });
      await expect(heading).toBeVisible();
    });
  });

  test.describe("after login", () => {
    test("redirect to root", async ({ page }) => {
      await setSession(page);
      await page.goto("/login");
      await page.waitForLoadState();
      await expect(page).not.toHaveURL("/login");
      await expect(page).toHaveURL("/");
    });
  });
});
