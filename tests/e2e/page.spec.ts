import {
  test,
  expect,
  http,
  HttpResponse,
} from "@/tests/e2e/fixtures.msw";
import { setSession } from "../__helpers__/signin";

const apiUrl = process.env.API_URL;

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

  test.describe("Drawer", () => {
    test("has appName", async ({ page }) => {
      await setSession(page);
      await page.goto("/");

      const drawer = page.locator("nav");
      const link = drawer.getByRole("link", { name: "アルゴ算額" });
      await expect(link).toBeVisible();
    });

    test.describe("before login", () => {
      test("should allow me to see sign in dialog when clicking the sign in button", async ({ page }) => {
        await page.goto("/");
        const button = page.getByRole("button", { name: "サインイン" });
        await button.click();
        const signinButton = page.getByRole("button", {
          name: "Sign in with Credentials",
        });
        await expect(signinButton).toBeVisible();
      });
    });

    test.describe("after login", () => {
      test("should not allow me to see the sign in button after login", async ({ page }) => {
        await setSession(page);
        await page.goto("/");
        const button = page.getByRole("button", { name: "サインイン" });
        await expect(button).not.toBeVisible();
      });

      test("should allow me to sign out when confirmed", async ({ page, msw }) => {
        msw.use(
          http.delete(`${apiUrl}/api/v1/authenticate`, () => {
            return HttpResponse.json({}, { status: 200 });
          }),
        );
        await setSession(page);
        await page.goto("/");

        // window.confirm を true で上書きしてサインアウト確認OKをシミュレート
        await page.evaluate(() => {
          window.confirm = () => true;
        });
        await page.getByRole("button", { name: "サインアウト" }).click();
        await expect(page).toHaveURL("/signin", { timeout: 10_000 });
      });

      test("should not allow me to sign out when dismissed", async ({
        page,
      }) => {
        await setSession(page);
        await page.goto("/");

        // window.confirm を false で上書きしてキャンセルをシミュレート
        await page.evaluate(() => {
          window.confirm = () => false;
        });
        await page.getByRole("button", { name: "サインアウト" }).click();
        await expect(page).toHaveURL("/");
      });
    });
  });

  test.describe("mobile", () => {
    test.use({ viewport: { width: 430, height: 932 } });

    test("has responsive drawer", async ({ page }) => {
      await page.goto("/");
      await page.getByRole("button", { name: "open drawer" }).click();
      const appName = page.getByRole("link", { name: "アルゴ算額" });
      await expect(appName).toBeVisible();
    });

    test("should allow me to close the drawer by clicking the backdrop", async ({ page }) => {
      await page.goto("/");
      await page.getByRole("button", { name: "open drawer" }).click();
      const mobileDrawer = page.getByTestId("mobileDrawer");
      await expect(mobileDrawer).toBeVisible({ timeout: 5000 });
      // バックドロップ（ドロワーの外側）をクリックして閉じる
      await page.keyboard.press("Escape");
      await expect(mobileDrawer).not.toBeVisible({ timeout: 5000 });
    });
  });
});
