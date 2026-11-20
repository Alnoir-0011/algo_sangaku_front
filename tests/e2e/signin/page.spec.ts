import { test, expect } from "@/tests/e2e/fixtures";
import { setSession } from "../../__helpers__/signin";

test.describe("/signin", () => {
  test.describe("before login", () => {
    test("has heading", async ({ page }) => {
      await page.goto("/signin");
      const heading = page.getByRole("heading", { name: "サインイン" });
      await expect(heading).toBeVisible();
    });
  });

  test.describe("sign-in button of the drawer", () => {
    test("should allow me to be sent to the sign-in page with the page I was on", async ({
      page,
    }) => {
      await page.goto("/shrines?searchType=Map");
      await page.getByRole("button", { name: "サインイン", exact: true }).click();

      await expect(page).toHaveURL(
        "/signin?callbackUrl=%2Fshrines%3FsearchType%3DMap",
      );
    });

    test("should not allow the page I was on to be lost when I press it on the sign-in page", async ({
      page,
    }) => {
      await page.goto("/signin?callbackUrl=%2Fshrines%3FsearchType%3DMap");
      await page.getByRole("button", { name: "サインイン", exact: true }).click();

      await expect(page).toHaveURL(
        "/signin?callbackUrl=%2Fshrines%3FsearchType%3DMap",
      );
    });
  });

  test.describe("after signin", () => {
    test("should allow me to be redirected to root when already signed in", async ({ page }) => {
      await setSession(page);
      await page.goto("/signin");
      await expect(page).not.toHaveURL("/login");
      await expect(page).toHaveURL("/");
    });
  });
});
