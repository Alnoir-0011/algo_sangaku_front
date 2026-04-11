import { test, expect } from "@playwright/experimental-ct-react";
import type { Sangaku } from "@/app/lib/definitions";
import UserSangaku from "@/app/ui/sangaku/UserSangaku";

const sangaku: Sangaku = {
  id: "15",
  type: "sangaku",
  attributes: {
    title: "test_title",
    description: "test_desc",
    source: "puts 'hi'",
    difficulty: "nomal",
    author_name: "test_author",
    inputs: [
      {
        id: 1,
        content: "input",
      },
    ],
  },
  relationships: {
    user: {
      data: {
        id: "1",
        type: "user",
      },
    },
    shrine: {
      data: null,
    },
  },
};

test.describe("UserSangaku", () => {
  test("has sangaku title", async ({ mount }) => {
    const component = await mount(<UserSangaku sangaku={sangaku} />);
    const title = component.getByRole("heading", { name: "test_title" });
    await expect(title).toBeVisible();
  });

  test("has sangaku description", async ({ mount, page }) => {
    await mount(<UserSangaku sangaku={sangaku} />);
    await expect(page.getByText("test_desc")).toBeVisible();
  });

  test("has sangaku difficulty", async ({ mount, page }) => {
    await mount(<UserSangaku sangaku={sangaku} />);
    await expect(page.getByText("普通")).toBeVisible();
  });

  test("has edit page link", async ({ mount, page }) => {
    const component = await mount(<UserSangaku sangaku={sangaku} />);
    const menuButton = component.getByTestId("MoreVertIcon");
    await menuButton.click();
    // MUI Menu は Portal でレンダリングされるため page スコープで検索する
    // MenuItem は component={NextLink} でも role="menuitem" が付与される
    const editLink = page.getByRole("menuitem", { name: "編集" });
    await expect(editLink).toBeVisible();
  });

  test("has delete button", async ({ mount, page }) => {
    const component = await mount(<UserSangaku sangaku={sangaku} />);
    const menuButton = component.getByTestId("MoreVertIcon");
    await menuButton.click();
    // MUI Menu は Portal でレンダリングされるため page スコープで検索する
    const deleteButton = page.getByRole("menuitem", { name: "削除" });
    await expect(deleteButton).toBeVisible();
  });
});
