import { test, expect } from "@/tests/fixtures.ct";
import type { Sangaku } from "@/app/lib/definitions";
import UserSangaku from "@/app/ui/sangaku/UserSangaku";

const sangaku: Sangaku = {
  id: "15",
  type: "sangaku",
  attributes: {
    title: "test_title",
    description: "test_desc",
    source: "puts 'hi'",
    difficulty: "normal",
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
  test("should allow me to see sangaku title", async ({ mount }) => {
    const component = await mount(<UserSangaku sangaku={sangaku} />);
    const title = component.getByRole("heading", { name: "test_title" });
    await expect(title).toBeVisible();
  });

  test("should allow me to see sangaku description", async ({ mount, page }) => {
    await mount(<UserSangaku sangaku={sangaku} />);
    await expect(page.getByText("test_desc")).toBeVisible();
  });

  test("should allow me to see sangaku difficulty as Japanese text", async ({ mount, page }) => {
    await mount(<UserSangaku sangaku={sangaku} />);
    await expect(page.getByText("普通")).toBeVisible();
  });

  test("should allow me to see edit link in menu", async ({ mount, page }) => {
    const component = await mount(<UserSangaku sangaku={sangaku} />);
    const menuButton = component.getByRole("button", { name: "算額のメニューを開く" });
    await menuButton.click();
    // MUI Menu は Portal でレンダリングされるため page スコープで検索する
    // MenuItem は component={NextLink} でも role="menuitem" が付与される
    const editLink = page.getByRole("menuitem", { name: "編集" });
    await expect(editLink).toBeVisible();
  });

  test("should allow me to see delete button in menu", async ({ mount, page }) => {
    const component = await mount(<UserSangaku sangaku={sangaku} />);
    const menuButton = component.getByRole("button", { name: "算額のメニューを開く" });
    await menuButton.click();
    // MUI Menu は Portal でレンダリングされるため page スコープで検索する
    const deleteButton = page.getByRole("menuitem", { name: "削除" });
    await expect(deleteButton).toBeVisible();
  });
});
