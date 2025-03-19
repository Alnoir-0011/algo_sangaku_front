import { test, expect } from "@playwright/test";
import { setSession } from "./__helpers__/login";

test.describe("TopPage", () => {
  test.describe("mainNode", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/");
    });

    test("has title", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: "アルゴ算額" }),
      ).toBeVisible();
    });

    test("has description", async ({ page }) => {
      const mainNode = page.locator("main");
      await expect(
        mainNode.getByText(
          "算額とは、神社や寺院に奉納された和算の絵馬のことで、日本独自に広まった文化だと言われています。難問が多いですが、問題が解けた喜びを神仏に感謝したり、学業成就を祈願する風習として親しまれてきました。",
          { exact: true },
        ),
      ).toBeVisible();
    });

    test("has link to createSangaku page", async ({ page }) => {
      const mainNode = page.locator("main");
      const link = mainNode.getByRole("link", { name: "算額を作る" });
      await expect(link).toBeVisible();
    });

    test("has link to showSangakus page", async ({ page }) => {
      const mainNode = page.locator("main");
      const link = mainNode.getByRole("link", { name: "算額を確認" });
      await expect(link).toBeVisible();
    });

    test("has link to map page", async ({ page }) => {
      const mainNode = page.locator("main");
      const link = mainNode.getByRole("link", { name: "神社を探す" });
      await expect(link).toBeVisible();
    });

    test("has link to answerSangaku page", async ({ page }) => {
      const mainNode = page.locator("main");
      const link = mainNode.getByRole("link", { name: "算額を解く" });
      await expect(link).toBeVisible();
    });
  });

  const test_user = {
    user: {
      name: "testuser",
      email: "test_user@example.com",
      picture: "https://avatars.githubusercontent.com/u/000000",
      nickname: "test nickname",
    },
    expires: "dummy",
    idToken: "dummy",
  };

  test.describe("Drawer", () => {
    test("has appName", async ({ browser }) => {
      const page = await setSession(browser, test_user);
      await page.goto("/");

      const drawer = page.locator("nav");
      const link = drawer.getByRole("link", { name: "アルゴ算額" });
      await expect(link).toBeVisible();
    });

    test.describe("before login", () => {
      test("has link to SignIn", async ({ page }) => {
        await page.goto("/");
        const link = page.getByRole("link", { name: "サインイン" });
        await link.click();
        await expect(page).toHaveURL("/login");
        const heading = page.getByRole("heading", { name: "ログイン" });
        await expect(heading).toBeVisible();
      });
    });

    test.describe("after login", () => {
      test("has not link to SignIn", async ({ browser }) => {
        const page = await setSession(browser, test_user);
        await page.goto("/");
        await page.waitForLoadState();
        const link = page.getByRole("link", { name: "サインイン" });
        await expect(link).not.toBeVisible();
      });
    });
  });
});
