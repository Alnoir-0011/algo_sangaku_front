import { test, expect } from "@playwright/test";

test.skip("has title", async ({ page }) => {
  await page.goto("https://playwright.dev/");

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Playwright/);
});

test.skip("get started link", async ({ page }) => {
  await page.goto("https://playwright.dev/");

  // Click the get started link.
  await page.getByRole("link", { name: "Get started" }).click();

  // Expects page to have a heading with the name of Installation.
  await expect(
    page.getByRole("heading", { name: "Installation" }),
  ).toBeVisible();
});

test.skip('has heading "root"', async ({ page }) => {
  await page.goto("/");
  const heading = page.getByRole("heading", { name: "root" });
  await expect(heading).toBeVisible();
});

test.describe("mobile", () => {
  test.use({ viewport: { width: 430, height: 932 } });

  test.only("has responsive drawer", async ({ page }) => {
    page.goto("/");
    await page.getByRole("button", { name: "open drawer" }).click();
    await page.waitForLoadState();
    const appName = page.getByRole("link", { name: "アルゴ算額" });
    await expect(appName).toBeVisible();
  });
});
