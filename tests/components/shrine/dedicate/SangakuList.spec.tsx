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

// SangakuList
test.describe("SangakuList", () => {
  // 位置情報が取れるまで奉納ボタンは押せない
  test.use({
    geolocation: { latitude: 35.6809591, longitude: 139.7673068 },
    permissions: ["geolocation"],
  });

  // 各算額のタイトルと説明が見える
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

  // 各算額の難易度ラベルが見える
  test("should allow me to see the difficulty label of each sangaku", async ({
    mount,
  }) => {
    const component = await mount(
      <SangakuListWithPromise sangakus={sangakus} totalPage={1} shrine={shrine} />,
    );

    await expect(component.getByText("普通", { exact: true })).toBeVisible();
    await expect(component.getByText("難しい", { exact: true })).toBeVisible();
  });

  // 総ページ数が 3 のとき、ページネーションのボタンが見える
  test("should allow me to see pagination buttons when total page is 3", async ({
    mount,
  }) => {
    const component = await mount(
      <SangakuListWithPromise sangakus={sangakus} totalPage={3} shrine={shrine} />,
    );

    await expect(component.getByRole("button", { name: "2ページ目" })).toBeVisible();
    await expect(component.getByRole("button", { name: "3ページ目" })).toBeVisible();
  });

  // 算額を選択する前は、確認モーダルが見えない
  test("should not allow me to see the confirm modal before I select a sangaku", async ({
    mount,
    page,
  }) => {
    await mount(
      <SangakuListWithPromise sangakus={sangakus} totalPage={1} shrine={shrine} />,
    );

    await expect(page.getByTestId("monaco-editor")).toHaveCount(0);
  });

  // 選択した算額の確認モーダルを開ける
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

  // 並べ替えの算額を選択したとき、コードブロックが見える
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

  // 並べ替えの算額を選択して取得が失敗した後、コードブロックの取得を再試行できる
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
  // 再試行中に確認モーダルを閉じたとき、確認モーダルが再び開いて見えることはない
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

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.waitForTimeout(1_500);

    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  // 再試行の直後に、Escape キーで確認モーダルを閉じられる
  test("should allow me to close the confirm modal with the Escape key right after retrying", async ({
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

    await page.keyboard.press("Escape");

    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  // 別の算額を選択したとき、前の算額の奉納画面が見えない
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
    await page.keyboard.press("Escape");
    await expect(page.getByText("算額を奉納しました")).toHaveCount(0);

    await component.getByRole("button", { name: /title_2/ }).click();

    await expect(
      page.getByRole("button", { name: "この算額を奉納する" }),
    ).toBeVisible();
    await expect(page.getByText("算額を奉納しました")).toHaveCount(0);
  });

  // 選択中の算額が一覧から消えても、確認モーダルが見え続ける
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

  // 算額一覧の取得が失敗したとき、メッセージが見える
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

  // Escape キーで確認モーダルを閉じられる
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

  // 奉納の直後に、Escape キーで奉納画面を閉じられる
  test("should allow me to close the dedicated screen with the Escape key right after dedicating", async ({
    mount,
    page,
  }) => {
    const component = await mount(
      <SangakuListWithPromise sangakus={sangakus} totalPage={1} shrine={shrine} />,
    );
    await component.getByRole("button", { name: /title_1/ }).click();
    await page.getByRole("button", { name: "この算額を奉納する" }).click();
    await expect(page.getByText("算額を奉納しました")).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(page.getByText("算額を奉納しました")).toHaveCount(0);
  });
});
