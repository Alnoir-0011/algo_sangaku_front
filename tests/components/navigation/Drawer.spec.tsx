import { test, expect } from "@/tests/fixtures.ct";
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
    test("should allow me to see app name link", async ({ mount }) => {
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

    test("should allow me to see link to map page", async ({ mount }) => {
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

    test("should allow me to see sign-in button", async ({ mount }) => {
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

    test("should allow me to see link to privacy policy page", async ({ mount }) => {
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

    test("should allow me to see link to terms of use page", async ({ mount }) => {
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
    test("should allow me to see app name link", async ({ mount }) => {
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

    test("should allow me to see link to map page", async ({ mount }) => {
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

    test("should not allow me to see sign-in button when logged in", async ({ mount }) => {
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

    test("should allow me to see link to create sangaku page", async ({ mount }) => {
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

    test("should allow me to see link to answer sangaku page", async ({ mount }) => {
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

    test("should allow me to see link to own sangaku list page", async ({ mount }) => {
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

    test("should allow me to see link to edit profile page", async ({ mount }) => {
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

    test("should allow me to see sign-out button", async ({ mount }) => {
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

    test("should allow me to see link to privacy policy page", async ({ mount }) => {
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

    test("should allow me to see link to terms of use page", async ({ mount }) => {
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
