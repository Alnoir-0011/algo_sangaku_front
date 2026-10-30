import { test, expect } from "@/tests/fixtures.ct";
import DedicatedSangakuListView from "@/app/ui/sangaku/DedicatedSangakuListView";
import type { Difficulty, Sangaku } from "@/app/lib/definitions";

// Modal は MUI Modal で Portal 描画されるため、モーダル内の要素は
// component 配下ではなく page 全体から取得する。
// 神社名と「算額が写された数」は、playwright-ct.config.ts の alias で差し替えられる
// tests/__mocks__/data の fetchShrine / fetchUserSangakuResult の固定値
// （テスト神社 / user_sangaku_save_count: 5）が表示される。

const buildSangaku = (
  id: string,
  title: string,
  difficulty: Difficulty,
): Sangaku => ({
  id,
  type: "sangaku",
  attributes: {
    title,
    description: `${title}_desc`,
    source: "puts 'hi'",
    difficulty,
    kind: "code",
    inputs: [{ id: 1, content: "input_1" }],
    author_name: "test_author",
  },
  relationships: {
    user: { data: { id: "1", type: "user" } },
    shrine: { data: { id: "1", type: "shrine" } },
  },
});

const sangakus = [
  buildSangaku("1", "title_1", "normal"),
  buildSangaku("2", "title_2", "difficult"),
];

test.describe("DedicatedSangakuListView", () => {
  test("should allow me to see the title and description of each sangaku", async ({
    mount,
  }) => {
    const component = await mount(
      <DedicatedSangakuListView sangakus={sangakus} totalPage={1} />,
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
      <DedicatedSangakuListView sangakus={sangakus} totalPage={1} />,
    );

    await expect(component.getByText("普通", { exact: true })).toBeVisible();
    await expect(component.getByText("難しい", { exact: true })).toBeVisible();
  });

  test("should allow me to see pagination buttons when total page is 3", async ({
    mount,
  }) => {
    const component = await mount(
      <DedicatedSangakuListView sangakus={sangakus} totalPage={3} />,
    );

    await expect(component.getByRole("button", { name: "page 2" })).toBeVisible();
    await expect(component.getByRole("button", { name: "page 3" })).toBeVisible();
  });

  test("should not allow me to see the shrine modal before I select a sangaku", async ({
    mount,
    page,
  }) => {
    await mount(<DedicatedSangakuListView sangakus={sangakus} totalPage={1} />);

    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("should allow me to see the shrine name and save count when I select a sangaku", async ({
    mount,
    page,
  }) => {
    const component = await mount(
      <DedicatedSangakuListView sangakus={sangakus} totalPage={1} />,
    );

    await component.getByRole("button", { name: /title_1/ }).click();

    await expect(
      page.getByRole("heading", { name: "テスト神社" }),
    ).toBeVisible();
    await expect(page.getByText(/算額が写された数/)).toContainText("5");
  });

  test("should not allow me to see the sangaku result and should allow me to see an error message when fetching the result fails", async ({
    mount,
    page,
  }) => {
    const component = await mount(
      <DedicatedSangakuListView sangakus={sangakus} totalPage={1} />,
      { hooksConfig: { fetchUserSangakuResultRejectCount: 1 } },
    );

    await component.getByRole("button", { name: /title_1/ }).click();

    await expect(
      page.getByText("算額の情報の取得に失敗しました"),
    ).toBeVisible();
    await expect(page.getByText(/算額が写された数/)).toHaveCount(0);
  });

  test("should allow me to see the sangaku result without a shrine name when the sangaku has no shrine", async ({
    mount,
    page,
  }) => {
    const withoutShrine: Sangaku = {
      ...buildSangaku("5", "title_5", "normal"),
      relationships: {
        user: { data: { id: "1", type: "user" } },
        shrine: { data: null },
      },
    };
    const component = await mount(
      <DedicatedSangakuListView sangakus={[withoutShrine]} totalPage={1} />,
    );

    await component.getByRole("button", { name: /title_5/ }).click();

    await expect(page.getByText(/算額が写された数/)).toContainText("5");
    await expect(
      page.getByRole("heading", { name: "テスト神社" }),
    ).toHaveCount(0);
  });

  test("should allow me to close the shrine modal with the Escape key", async ({
    mount,
    page,
  }) => {
    const component = await mount(
      <DedicatedSangakuListView sangakus={sangakus} totalPage={1} />,
    );
    await component.getByRole("button", { name: /title_1/ }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});
