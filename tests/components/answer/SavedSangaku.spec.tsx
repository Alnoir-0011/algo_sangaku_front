import { test, expect } from "@/tests/fixtures.ct";
import type { Sangaku } from "@/app/lib/definitions";
import SavedSangaku from "@/app/ui/answer/SavedSangaku";

const sangaku: Sangaku = {
  id: "1",
  type: "sangaku",
  attributes: {
    title: "test_title",
    description: "test_desc",
    source: "puts 'hi'",
    difficulty: "normal",
    author_name: "test_author",
    inputs: [{ id: 1, content: "input" }],
  },
  relationships: {
    user: {
      data: {
        id: "42",
        type: "user",
      },
    },
    shrine: {
      data: null,
    },
  },
};

test.describe("SavedSangaku", () => {
  // RED: SavedSangaku の作者名テキストがリンクになっていない（relationships.user.data.id を使用した /profiles/{id} リンクが未実装）
  test("should allow me to see author name as a link when relationships.user.data.id exists", async ({
    mount,
  }) => {
    // Act
    const component = await mount(<SavedSangaku sangaku={sangaku} />);

    // Assert
    const authorLink = component.getByRole("link", { name: "test_author" });
    await expect(authorLink).toBeVisible();
  });

  // RED: SavedSangaku の作者名テキストがリンクになっていない（relationships.user.data.id を使用した /profiles/{id} リンクが未実装）
  test("should allow me to navigate to /profiles/42 when relationships.user.data.id is '42'", async ({
    mount,
  }) => {
    // Act
    const component = await mount(<SavedSangaku sangaku={sangaku} />);

    // Assert
    const authorLink = component.getByRole("link", { name: "test_author" });
    await expect(authorLink).toHaveAttribute("href", "/profiles/42");
  });

  // RED: フォールバック未実装のため、data が undefined でも href="/profiles/undefined" のリンクが生成されうる
  test("should allow me to see author name as text when relationships.user.data is missing", async ({
    mount,
  }) => {
    // Arrange
    const sangakuWithoutUserData = {
      ...sangaku,
      relationships: {
        ...sangaku.relationships,
        user: {
          data: undefined,
        },
      },
    } as unknown as Sangaku;

    // Act
    const component = await mount(
      <SavedSangaku sangaku={sangakuWithoutUserData} />,
    );

    // Assert
    await expect(component.getByText("test_author")).toBeVisible();
  });

  // RED: フォールバック未実装のため、data が undefined でも href="/profiles/undefined" のリンクが生成されうる
  test("should not allow me to see a profile link when relationships.user.data is missing", async ({
    mount,
  }) => {
    // Arrange
    const sangakuWithoutUserData = {
      ...sangaku,
      relationships: {
        ...sangaku.relationships,
        user: {
          data: undefined,
        },
      },
    } as unknown as Sangaku;

    // Act
    const component = await mount(
      <SavedSangaku sangaku={sangakuWithoutUserData} />,
    );

    // Assert
    await expect(
      component.getByRole("link", { name: "test_author" }),
    ).toHaveCount(0);
  });
});
