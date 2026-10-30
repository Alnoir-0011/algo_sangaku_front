import { test, expect } from "@/tests/fixtures.ct";
import SangakuListView from "@/app/ui/shrine/dedicate/SangakuListView";
import type { Difficulty, Sangaku, Shrine } from "@/app/lib/definitions";

// ConfirmModal は MUI Modal で Portal 描画されるため、モーダル内の要素は
// component 配下ではなく page 全体から取得する。
// Monaco Editor は playwright-ct.config.ts の alias で data-testid="monaco-editor" の
// <div> に差し替えられ、value をそのままテキスト描画する。

const shrine: Shrine = {
  id: "1",
  type: "shrine",
  attributes: {
    name: "テスト神社",
    address: "東京都千代田区1-1",
    latitude: 35.6809591,
    longitude: 139.7673068,
    place_id: "place123",
  },
};

const buildSangaku = (
  id: string,
  title: string,
  difficulty: Difficulty,
  source: string,
): Sangaku => ({
  id,
  type: "sangaku",
  attributes: {
    title,
    description: `${title}_desc`,
    source,
    difficulty,
    kind: "code",
    inputs: [{ id: 1, content: "input_1" }],
    author_name: "test_author",
  },
  relationships: {
    user: { data: { id: "1", type: "user" } },
    shrine: { data: null },
  },
});

const sangakus = [
  buildSangaku("1", "title_1", "normal", "puts 'first'"),
  buildSangaku("2", "title_2", "difficult", "puts 'second'"),
];

test.describe("SangakuListView", () => {
  test("should allow me to see the title and description of each sangaku", async ({
    mount,
  }) => {
    const component = await mount(
      <SangakuListView sangakus={sangakus} totalPage={1} shrine={shrine} />,
    );

    await expect(component.getByText("title_1", { exact: true })).toBeVisible();
    await expect(component.getByText("title_1_desc")).toBeVisible();
    await expect(component.getByText("title_2", { exact: true })).toBeVisible();
    await expect(component.getByText("title_2_desc")).toBeVisible();
  });

  test("should allow me to see the difficulty label of each sangaku", async ({
    mount,
  }) => {
    const component = await mount(
      <SangakuListView sangakus={sangakus} totalPage={1} shrine={shrine} />,
    );

    await expect(component.getByText("普通", { exact: true })).toBeVisible();
    await expect(component.getByText("難しい", { exact: true })).toBeVisible();
  });

  test("should allow me to see pagination buttons when total page is 3", async ({
    mount,
  }) => {
    const component = await mount(
      <SangakuListView sangakus={sangakus} totalPage={3} shrine={shrine} />,
    );

    await expect(component.getByRole("button", { name: "page 2" })).toBeVisible();
    await expect(component.getByRole("button", { name: "page 3" })).toBeVisible();
  });

  test("should not allow me to see the confirm modal before I select a sangaku", async ({
    mount,
    page,
  }) => {
    await mount(
      <SangakuListView sangakus={sangakus} totalPage={1} shrine={shrine} />,
    );

    await expect(page.getByTestId("monaco-editor")).toHaveCount(0);
  });

  test("should allow me to open the confirm modal of the sangaku I select", async ({
    mount,
    page,
  }) => {
    const component = await mount(
      <SangakuListView sangakus={sangakus} totalPage={1} shrine={shrine} />,
    );

    await component.getByRole("button", { name: /title_2/ }).click();

    await expect(page.getByTestId("monaco-editor")).toHaveText("puts 'second'");
  });

  test("should allow me to close the confirm modal with the Escape key", async ({
    mount,
    page,
  }) => {
    const component = await mount(
      <SangakuListView sangakus={sangakus} totalPage={1} shrine={shrine} />,
    );
    await component.getByRole("button", { name: /title_1/ }).click();
    await expect(page.getByTestId("monaco-editor")).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(page.getByTestId("monaco-editor")).toHaveCount(0);
  });
});
