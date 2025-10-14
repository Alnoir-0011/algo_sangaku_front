import { test, expect } from "@playwright/experimental-ct-react";
import Drawer from "@/app/ui/navigation/Drawer";
import { mockClientSession } from "../../__helpers__/signin";

test.describe.skip("Drawer", () => {
  test.describe("before login", () => {
    test.beforeEach(async ({ page }) => {
      await mockClientSession(page, null);
    });

    test("has AppName", async ({ mount }) => {
      const component = await mount(
        <Drawer
          drawerWidth={240}
          mobileOpen={false}
          handleDrawerTransitionEnd={() => {}}
          handleDrawerClose={() => {}}
        />,
      );
      const heading = component.getByRole("link", { name: "アルゴ算額" });
      await expect(heading).toBeVisible();
    });

    test("has link to Map page", async ({ mount }) => {
      const component = await mount(
        <Drawer
          drawerWidth={240}
          mobileOpen={false}
          handleDrawerTransitionEnd={() => {}}
          handleDrawerClose={() => {}}
        />,
      );
      const link = component.getByRole("link", { name: "神社を探す" });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", "/shrines");
    });

    test("has button to SignIn page", async ({ mount }) => {
      const component = await mount(
        <Drawer
          drawerWidth={240}
          mobileOpen={false}
          handleDrawerTransitionEnd={() => {}}
          handleDrawerClose={() => {}}
        />,
      );
      const button = component.getByRole("button", { name: "サインイン" });
      await expect(button).toBeVisible();
    });

    test("has link to Privacy Policy page", async ({ mount }) => {
      const component = await mount(
        <Drawer
          drawerWidth={240}
          mobileOpen={false}
          handleDrawerTransitionEnd={() => {}}
          handleDrawerClose={() => {}}
        />,
      );
      const link = component.getByRole("link", {
        name: "プライバシーポリシー",
      });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", "#");
    });

    test("has link to Terms of use page", async ({ mount }) => {
      const component = await mount(
        <Drawer
          drawerWidth={240}
          mobileOpen={false}
          handleDrawerTransitionEnd={() => {}}
          handleDrawerClose={() => {}}
        />,
      );
      const link = component.getByRole("link", { name: "利用規約" });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", "#");
    });
  });

  test.describe("after login", () => {
    test.beforeEach(async ({ page }) => {
      const json = {
        user: {
          name: "testuser",
          email: "test_user@example.com",
          picture: "https://avatars.githubusercontent.com/u/000000",
          nickname: "test nickname",
        },
        expires: "dummy",
        idToken: "dummy",
      };
      await mockClientSession(page, json);
    });
    test("has AppName", async ({ mount }) => {
      const component = await mount(
        <Drawer
          drawerWidth={240}
          mobileOpen={false}
          handleDrawerTransitionEnd={() => {}}
          handleDrawerClose={() => {}}
        />,
      );
      const heading = component.getByRole("link", { name: "アルゴ算額" });
      await expect(heading).toBeVisible();
    });

    test("has link to Map page", async ({ mount }) => {
      const component = await mount(
        <Drawer
          drawerWidth={240}
          mobileOpen={false}
          handleDrawerTransitionEnd={() => {}}
          handleDrawerClose={() => {}}
        />,
      );
      const link = component.getByRole("link", { name: "神社を探す" });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", "/shrines");
    });

    test("has not link to SignIn page", async ({ mount }) => {
      const component = await mount(
        <Drawer
          drawerWidth={240}
          mobileOpen={false}
          handleDrawerTransitionEnd={() => {}}
          handleDrawerClose={() => {}}
        />,
      );
      const link = component.getByRole("button", { name: "サインイン" });
      await expect(link).not.toBeVisible();
      // await expect(link).toHaveAttribute("href", "/login");
    });

    test("has link to CreateSangaku page", async ({ mount }) => {
      const component = await mount(
        <Drawer
          drawerWidth={240}
          mobileOpen={false}
          handleDrawerTransitionEnd={() => {}}
          handleDrawerClose={() => {}}
        />,
      );
      const link = component.getByRole("link", { name: "算額を作る" });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", "/sangakus/create");
    });

    test("has link to AnswerSangaku page", async ({ mount }) => {
      const component = await mount(
        <Drawer
          drawerWidth={240}
          mobileOpen={false}
          handleDrawerTransitionEnd={() => {}}
          handleDrawerClose={() => {}}
        />,
      );
      const link = component.getByRole("link", { name: "算額を解く" });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", "/solve");
    });

    test("has link to ShowOwnSangaku page", async ({ mount }) => {
      const component = await mount(
        <Drawer
          drawerWidth={240}
          mobileOpen={false}
          handleDrawerTransitionEnd={() => {}}
          handleDrawerClose={() => {}}
        />,
      );
      const link = component.getByRole("link", { name: "自分の算額を見る" });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", "/user/sangakus");
    });

    test("has link to edit profile page", async ({ mount }) => {
      const component = await mount(
        <Drawer
          drawerWidth={240}
          mobileOpen={false}
          handleDrawerTransitionEnd={() => {}}
          handleDrawerClose={() => {}}
        />,
      );
      const link = component.getByRole("link", { name: "プロフィール編集" });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", "/user/profile");
    });

    test("has link to Logout", async ({ mount }) => {
      const component = await mount(
        <Drawer
          drawerWidth={240}
          mobileOpen={false}
          handleDrawerTransitionEnd={() => {}}
          handleDrawerClose={() => {}}
        />,
      );
      const button = component.getByRole("button", { name: "ログアウト" });
      await expect(button).toBeVisible();
    });

    test("has link to Privacy Policy page", async ({ mount }) => {
      const component = await mount(
        <Drawer
          drawerWidth={240}
          mobileOpen={false}
          handleDrawerTransitionEnd={() => {}}
          handleDrawerClose={() => {}}
        />,
      );
      const link = component.getByRole("link", {
        name: "プライバシーポリシー",
      });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", "#");
    });

    test("has link to Terms of use page", async ({ mount }) => {
      const component = await mount(
        <Drawer
          drawerWidth={240}
          mobileOpen={false}
          handleDrawerTransitionEnd={() => {}}
          handleDrawerClose={() => {}}
        />,
      );
      const link = component.getByRole("link", { name: "利用規約" });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", "#");
    });
  });
});
