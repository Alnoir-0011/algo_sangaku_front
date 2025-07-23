import { test, expect } from "@playwright/experimental-ct-react";
import ResponsiveNav from "@/app/ui/navigation/ResponsiveNav";

// useSession()のモック化が厳しいためスキップ、代替を../page.spec.tsに追加
test.describe.skip("ResponsiveNav", () => {
  test.beforeEach(async ({ page }) => {
    await page.route(
      "http://localhost:3100/api/auth/session",
      async (route) => {
        await route.fulfill({});
      },
    );
  });

  test.describe("Desktop", () => {
    test.use({ viewport: { width: 1024, height: 720 } });

    test("has not hamberger-menu button", async ({ mount }) => {
      const component = await mount(<ResponsiveNav drawerWidth={240} />);
      const button = component.getByRole("button", { name: "opne drawer" });
      await expect(button).not.toBeVisible();
    });

    test("has opened sidenav", async ({ mount }) => {
      const component = await mount(<ResponsiveNav drawerWidth={240} />);
      const appName = component.getByRole("link", { name: "アルゴ算額" });
      await expect(appName).toBeVisible();
    });
  });

  test.describe("Mobile", () => {
    test.use({ viewport: { width: 430, height: 932 } });

    // 画面上には表示されるがコンポーネントテストで要素を取得できないためexample.spec.tsxに代替のテストを記載
    test.skip("opne drawer when click button", async ({ mount }) => {
      const component = await mount(<ResponsiveNav drawerWidth={240} />);
      await expect(
        component.getByRole("link", { name: "アルゴ算額" }),
      ).not.toBeVisible();
      const button = component.getByRole("button", { name: "open drawer" });
      await button.click();
      // const appName = component.getByRole("link", { name: 'アルゴ算額' });
      // const appName = drawerRoot.getByText('アルゴ算額').;
      // await expect(appName).toBeVisible();
      await expect(
        component.getByRole("link", { name: "アルゴ算額" }),
      ).toBeVisible();
    });
  });
});
