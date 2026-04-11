import { test, expect } from "@playwright/experimental-ct-react";
import type { Session } from "next-auth";
import Drawer from "@/app/ui/navigation/Drawer";

const mockSession: Session = {
  user: {
    name: "testuser",
    email: "test_user@example.com",
    image: "https://avatars.githubusercontent.com/u/000000",
  },
  expires: "dummy",
};

test.describe("Drawer", () => {
  test.describe("before login", () => {
    test("has AppName", async ({ mount }) => {
      const component = await mount(
        <Drawer
          drawerWidth={240}
          mobileOpen={false}
          handleDrawerTransitionEnd={() => {}}
          handleDrawerClose={() => {}}
        />,
        { hooksConfig: { session: null } },
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
        { hooksConfig: { session: null } },
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
        { hooksConfig: { session: null } },
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
        { hooksConfig: { session: null } },
      );
      const link = component.getByRole("link", {
        name: "プライバシーポリシー",
      });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", "/privacy_policy");
    });

    test("has link to Terms of use page", async ({ mount }) => {
      const component = await mount(
        <Drawer
          drawerWidth={240}
          mobileOpen={false}
          handleDrawerTransitionEnd={() => {}}
          handleDrawerClose={() => {}}
        />,
        { hooksConfig: { session: null } },
      );
      const link = component.getByRole("link", { name: "利用規約" });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", "/terms_of_use");
    });
  });

  test.describe("after login", () => {
    test("has AppName", async ({ mount }) => {
      const component = await mount(
        <Drawer
          drawerWidth={240}
          mobileOpen={false}
          handleDrawerTransitionEnd={() => {}}
          handleDrawerClose={() => {}}
        />,
        { hooksConfig: { session: mockSession } },
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
        { hooksConfig: { session: mockSession } },
      );
      const link = component.getByRole("link", { name: "神社を探す" });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", "/shrines");
    });

    test("has not button to SignIn page", async ({ mount }) => {
      const component = await mount(
        <Drawer
          drawerWidth={240}
          mobileOpen={false}
          handleDrawerTransitionEnd={() => {}}
          handleDrawerClose={() => {}}
        />,
        { hooksConfig: { session: mockSession } },
      );
      const button = component.getByRole("button", { name: "サインイン" });
      await expect(button).not.toBeVisible();
    });

    test("has link to CreateSangaku page", async ({ mount }) => {
      const component = await mount(
        <Drawer
          drawerWidth={240}
          mobileOpen={false}
          handleDrawerTransitionEnd={() => {}}
          handleDrawerClose={() => {}}
        />,
        { hooksConfig: { session: mockSession } },
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
        { hooksConfig: { session: mockSession } },
      );
      const link = component.getByRole("link", { name: "算額を解く" });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", "/saved_sangakus");
    });

    test("has link to ShowOwnSangaku page", async ({ mount }) => {
      const component = await mount(
        <Drawer
          drawerWidth={240}
          mobileOpen={false}
          handleDrawerTransitionEnd={() => {}}
          handleDrawerClose={() => {}}
        />,
        { hooksConfig: { session: mockSession } },
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
        { hooksConfig: { session: mockSession } },
      );
      const link = component.getByRole("link", { name: "プロフィール編集" });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", "/user/profile");
    });

    test("has signout button", async ({ mount }) => {
      const component = await mount(
        <Drawer
          drawerWidth={240}
          mobileOpen={false}
          handleDrawerTransitionEnd={() => {}}
          handleDrawerClose={() => {}}
        />,
        { hooksConfig: { session: mockSession } },
      );
      const button = component.getByRole("button", { name: "サインアウト" });
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
        { hooksConfig: { session: mockSession } },
      );
      const link = component.getByRole("link", {
        name: "プライバシーポリシー",
      });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", "/privacy_policy");
    });

    test("has link to Terms of use page", async ({ mount }) => {
      const component = await mount(
        <Drawer
          drawerWidth={240}
          mobileOpen={false}
          handleDrawerTransitionEnd={() => {}}
          handleDrawerClose={() => {}}
        />,
        { hooksConfig: { session: mockSession } },
      );
      const link = component.getByRole("link", { name: "利用規約" });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", "/terms_of_use");
    });
  });
});
