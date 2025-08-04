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

// NOTE: server actionを含むためスキップ

test.describe.skip("UserSangaku", () => {
  test("has sangaku title", async ({ mount }) => {
    const component = await mount(<UserSangaku sangaku={sangaku} />);
    const title = component.getByRole("heading", { name: "test_title" });
    await expect(title).toBeVisible();
  });

  test("has sangaku description", async ({ mount }) => {
    const component = await mount(<UserSangaku sangaku={sangaku} />);
    const description = component.getByRole("paragraph", { name: "test_desc" });
    await expect(description).toBeVisible();
  });

  test("has sangaku difficulty", async ({ mount }) => {
    const component = await mount(<UserSangaku sangaku={sangaku} />);
    const difficulty = component.getByRole("paragraph", { name: "普通" });
    await expect(difficulty).toBeVisible();
  });

  test("has edit page link", async ({ mount }) => {
    const component = await mount(<UserSangaku sangaku={sangaku} />);
    const menuButton = component.getByTestId("MoreVertIcon");
    await menuButton.click();
    const editLink = component.getByRole("link", { name: "編集" });
    await expect(editLink).toBeVisible();
  });

  test("has delete button", async ({ mount }) => {
    const component = await mount(<UserSangaku sangaku={sangaku} />);
    const menuButton = component.getByTestId("MoreVertIcon");
    await menuButton.click();
    const delteButton = component.getByRole("button", { name: "編集" });
    await expect(delteButton).toBeVisible();
  });
});
