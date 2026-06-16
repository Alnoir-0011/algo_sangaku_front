import { test, expect } from "@/tests/e2e/fixtures";

test.describe("mobile", () => {
  test.use({ viewport: { width: 430, height: 932 } });

  test("has responsive drawer", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "open drawer" }).click();
    await page.waitForLoadState();
    const appName = page.getByRole("link", { name: "アルゴ算額" });
    await expect(appName).toBeVisible();
  });
});
