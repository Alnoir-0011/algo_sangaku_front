import { test, expect } from "@/tests/fixtures.ct";
import ResponsiveNav from "@/app/ui/navigation/ResponsiveNav";

test.describe("ResponsiveNav", () => {
  test.describe("Desktop", () => {
    test.use({ viewport: { width: 1024, height: 720 } });

    test("should not allow me to see hamburger menu button on desktop", async ({ mount }) => {
      const component = await mount(<ResponsiveNav drawerWidth={240} />, {
        hooksConfig: { session: null },
      });
      const button = component.getByRole("button", { name: "open drawer" });
      await expect(button).not.toBeVisible();
    });

    test("should allow me to see app name link when sidenav is open", async ({ mount }) => {
      const component = await mount(<ResponsiveNav drawerWidth={240} />, {
        hooksConfig: { session: null },
      });
      const appName = component.getByRole("link", { name: "アルゴ算額" });
      await expect(appName).toBeVisible();
    });
  });

  test.describe("Mobile", () => {
    test.use({ viewport: { width: 430, height: 932 } });

    // 画面上には表示されるがコンポーネントテストで要素を取得できないためexample.spec.tsxに代替のテストを記載
    test.skip("should allow me to open drawer when click button", async ({ mount }) => {
      const component = await mount(<ResponsiveNav drawerWidth={240} />, {
        hooksConfig: { session: null },
      });
      await expect(
        component.getByRole("link", { name: "アルゴ算額" }),
      ).not.toBeVisible();
      const button = component.getByRole("button", { name: "open drawer" });
      await button.click();
      await expect(
        component.getByRole("link", { name: "アルゴ算額" }),
      ).toBeVisible();
    });

    test("should allow me to close the drawer by pressing Escape", async ({ mount, page }) => {
      await mount(<ResponsiveNav drawerWidth={240} />, {
        hooksConfig: { session: null },
      });
      const button = page.getByRole("button", { name: "open drawer" });
      await button.click();
      // MUIのDrawerはポータル経由でbodyに追加されるためpage経由で取得する
      const mobileDrawer = page.getByTestId("mobileDrawer");
      await expect(mobileDrawer).toBeVisible({ timeout: 5000 });
      await page.keyboard.press("Escape");
      await expect(mobileDrawer).not.toBeVisible({ timeout: 5000 });
    });
  });
});
