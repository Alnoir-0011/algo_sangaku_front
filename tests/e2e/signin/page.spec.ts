import { test, expect } from "@playwright/test";
import { setSession } from "../../__helpers__/signin";

test.describe("/signin", () => {
  test.describe("before login", () => {
    test("has heading", async ({ page }) => {
      await page.goto("/signin");
      const heading = page.getByRole("heading", { name: "サインイン" });
      await expect(heading).toBeVisible();
    });
  });

  test.describe("after signin", () => {
    test("redirect to root", async ({ page }) => {
      await setSession(page);
      await page.goto("/signin");
      await page.waitForLoadState();
      await expect(page).not.toHaveURL("/login");
      await expect(page).toHaveURL("/");
    });
  });
});
