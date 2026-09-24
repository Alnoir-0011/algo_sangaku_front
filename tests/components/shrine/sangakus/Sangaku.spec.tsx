import { test, expect } from "@/tests/fixtures.ct";
import type { Sangaku as SangakuType } from "@/app/lib/definitions";
import Sangaku from "@/app/ui/shrine/sangakus/Sangaku";

const sangaku: SangakuType = {
  id: "1",
  type: "sangaku",
  attributes: {
    title: "test_title",
    description: "test_desc",
    source: "puts 'hi'",
    difficulty: "normal",
    author_name: "test_author",
    inputs: [{ id: 1, content: "input" }],
    kind: "code",
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

test.describe("Sangaku", () => {
  test("should allow me to see コード記述 badge when sangaku kind is code", async ({
    mount,
    page,
  }) => {
    // Arrange
    const sangakuWithCodeKind: SangakuType = {
      ...sangaku,
      attributes: { ...sangaku.attributes, kind: "code" },
    };

    // Act
    await mount(<Sangaku sangaku={sangakuWithCodeKind} saved={false} />);

    // Assert
    await expect(page.getByText("コード記述")).toBeVisible();
  });

  test("should allow me to see 並べ替え badge when sangaku kind is reorder", async ({
    mount,
    page,
  }) => {
    // Arrange
    const sangakuWithReorderKind: SangakuType = {
      ...sangaku,
      attributes: { ...sangaku.attributes, kind: "reorder" },
    };

    // Act
    await mount(<Sangaku sangaku={sangakuWithReorderKind} saved={false} />);

    // Assert
    await expect(page.getByText("並べ替え")).toBeVisible();
  });
});
