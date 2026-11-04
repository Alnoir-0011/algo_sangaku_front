import { test, expect } from "@/tests/fixtures.ct";
import { SangakuListWithPromise } from "./SangakuListStories";
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

const buildReorderSangaku = (): Sangaku => {
  const base = buildSangaku("3", "title_3", "easy", "");
  return {
    ...base,
    attributes: { ...base.attributes, kind: "reorder", source: undefined },
  };
};

const sangakus = [
  buildSangaku("1", "title_1", "normal", "puts 'first'"),
  buildSangaku("2", "title_2", "difficult", "puts 'second'"),
];

test.describe("SangakuList", () => {
  test("should allow me to see the title and description of each sangaku", async ({
    mount,
  }) => {
    const component = await mount(
      <SangakuListWithPromise sangakus={sangakus} totalPage={1} shrine={shrine} />,
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
      <SangakuListWithPromise sangakus={sangakus} totalPage={1} shrine={shrine} />,
    );

    await expect(component.getByText("普通", { exact: true })).toBeVisible();
    await expect(component.getByText("難しい", { exact: true })).toBeVisible();
  });

  test("should allow me to see pagination buttons when total page is 3", async ({
    mount,
  }) => {
    const component = await mount(
      <SangakuListWithPromise sangakus={sangakus} totalPage={3} shrine={shrine} />,
    );

    await expect(component.getByRole("button", { name: "page 2" })).toBeVisible();
    await expect(component.getByRole("button", { name: "page 3" })).toBeVisible();
  });

  test("should not allow me to see the confirm modal before I select a sangaku", async ({
    mount,
    page,
  }) => {
    await mount(
      <SangakuListWithPromise sangakus={sangakus} totalPage={1} shrine={shrine} />,
    );

    await expect(page.getByTestId("monaco-editor")).toHaveCount(0);
  });

  test("should allow me to open the confirm modal of the sangaku I select", async ({
    mount,
    page,
  }) => {
    const component = await mount(
      <SangakuListWithPromise sangakus={sangakus} totalPage={1} shrine={shrine} />,
    );

    await component.getByRole("button", { name: /title_2/ }).click();

    await expect(page.getByTestId("monaco-editor")).toHaveText("puts 'second'");
  });

  test("should allow me to see the code blocks when I select a reorder sangaku", async ({
    mount,
    page,
  }) => {
    const reorderSangaku = buildReorderSangaku();
    const component = await mount(
      <SangakuListWithPromise
        sangakus={[reorderSangaku]}
        totalPage={1}
        shrine={shrine}
      />,
    );

    await component.getByRole("button", { name: /title_3/ }).click();

    await expect(page.getByTestId("confirm-modal-code-block-1")).toContainText(
      "block_content_1",
    );
  });

  test("should allow me to retry fetching the code blocks after a failure when I select a reorder sangaku", async ({
    mount,
    page,
  }) => {
    const reorderSangaku = buildReorderSangaku();
    const component = await mount(
      <SangakuListWithPromise
        sangakus={[reorderSangaku]}
        totalPage={1}
        shrine={shrine}
      />,
      { hooksConfig: { fetchUserSangakuRejectCount: 1 } },
    );

    await component.getByRole("button", { name: /title_3/ }).click();
    await expect(
      page.getByText("コードブロックの取得に失敗しました"),
    ).toBeVisible();
    await page.getByRole("button", { name: "再試行" }).click();

    await expect(page.getByTestId("confirm-modal-code-block-1")).toContainText(
      "block_content_1",
    );
  });

  // 再試行の取得は fetchUserSangakuDelayMs だけ遅れて解決する（最初の取得は reject される）。
  // 取得の完了を待ってから state を更新する実装だと、完了でモーダルが開き直る。
  // 「開き直らない」という起きないことの確認なので、解決を待つ時間を固定で置く。
  test("should not allow me to see the confirm modal reopened when I close it while the retry is in progress", async ({
    mount,
    page,
  }) => {
    const reorderSangaku = buildReorderSangaku();
    const component = await mount(
      <SangakuListWithPromise
        sangakus={[reorderSangaku]}
        totalPage={1}
        shrine={shrine}
      />,
      {
        hooksConfig: {
          fetchUserSangakuRejectCount: 1,
          fetchUserSangakuDelayMs: 1_000,
        },
      },
    );
    await component.getByRole("button", { name: /title_3/ }).click();
    await page.getByRole("button", { name: "再試行" }).click();
    await expect(
      page.getByTestId("confirm-modal-code-blocks-loading"),
    ).toBeVisible();

    // 再試行で押したボタンが消えてフォーカスが外れるため、背景のクリックで閉じる
    await page.mouse.click(5, 5);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.waitForTimeout(1_500);

    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("should not allow me to see the dedicated screen of the previous sangaku when I select another sangaku", async ({
    mount,
    page,
  }) => {
    const component = await mount(
      <SangakuListWithPromise sangakus={sangakus} totalPage={1} shrine={shrine} />,
    );
    await component.getByRole("button", { name: /title_1/ }).click();
    await page.getByRole("button", { name: "この算額を奉納する" }).click();
    await expect(page.getByText("算額を奉納しました")).toBeVisible();
    // 完了画面には閉じるボタンがなく、送信ボタンが消えてフォーカスも外れるため、
    // Escape ではなくモーダルの外（背景）のクリックで閉じる。
    await page.mouse.click(5, 5);
    await expect(page.getByText("算額を奉納しました")).toHaveCount(0);

    await component.getByRole("button", { name: /title_2/ }).click();

    await expect(
      page.getByRole("button", { name: "この算額を奉納する" }),
    ).toBeVisible();
    await expect(page.getByText("算額を奉納しました")).toHaveCount(0);
  });

  test("should allow me to keep seeing the confirm modal when the selected sangaku is removed from the list", async ({
    mount,
    page,
  }) => {
    const component = await mount(
      <SangakuListWithPromise sangakus={sangakus} totalPage={1} shrine={shrine} />,
    );
    await component.getByRole("button", { name: /title_1/ }).click();
    await expect(page.getByTestId("monaco-editor")).toBeVisible();

    await component.update(
      <SangakuListWithPromise
        sangakus={[sangakus[1]]}
        totalPage={1}
        shrine={shrine}
      />,
    );

    await expect(component.getByText("title_1", { exact: true })).toHaveCount(0);
    await expect(page.getByTestId("monaco-editor")).toHaveText("puts 'first'");
  });

  test("should allow me to see the message when fetching the sangakus fails", async ({
    mount,
  }) => {
    const component = await mount(
      <SangakuListWithPromise
        sangakus={[]}
        totalPage={0}
        shrine={shrine}
        message="リクエストに失敗しました"
      />,
    );

    await expect(component.getByText("リクエストに失敗しました")).toBeVisible();
  });

  test("should allow me to close the confirm modal with the Escape key", async ({
    mount,
    page,
  }) => {
    const component = await mount(
      <SangakuListWithPromise sangakus={sangakus} totalPage={1} shrine={shrine} />,
    );
    await component.getByRole("button", { name: /title_1/ }).click();
    await expect(page.getByTestId("monaco-editor")).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(page.getByTestId("monaco-editor")).toHaveCount(0);
  });
});
