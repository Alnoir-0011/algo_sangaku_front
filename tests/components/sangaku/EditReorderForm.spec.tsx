import { test, expect } from "@/tests/fixtures.ct";
import EditReorderForm from "@/app/ui/sangaku/reorder/EditReorderForm";
import type { Sangaku } from "@/app/lib/definitions";

const sangaku: Sangaku = {
  id: "1",
  type: "sangaku",
  attributes: {
    title: "test_title",
    description: "test_description",
    difficulty: "normal",
    inputs: [],
    author_name: "test_user",
    kind: "reorder",
    code_blocks: [
      { id: 1, content: "puts 1", correct_position: 1 },
      { id: 2, content: "puts 2", correct_position: 2 },
      { id: 3, content: "dummy", correct_position: null },
    ],
  },
  relationships: {
    user: { data: { id: "1", type: "user" } },
    shrine: { data: null },
  },
};

test.describe("EditReorderForm", () => {
  test("should allow me to see pre-filled title when sangaku has a title", async ({
    mount,
  }) => {
    const component = await mount(<EditReorderForm sangaku={sangaku} />);

    await expect(component.getByLabel("タイトル")).toHaveValue("test_title");
  });

  test("should allow me to see converted block contents when sangaku has code blocks", async ({
    mount,
  }) => {
    const component = await mount(<EditReorderForm sangaku={sangaku} />);

    await expect(component.getByLabel("block-content-0")).toHaveValue(
      "puts 1",
    );
    await expect(component.getByLabel("block-content-1")).toHaveValue(
      "puts 2",
    );
    await expect(component.getByLabel("block-content-2")).toHaveValue(
      "dummy",
    );
  });
});
