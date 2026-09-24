import { test, expect } from "@/tests/fixtures.ct";
import ConfirmModal from "@/app/ui/shrine/dedicate/ConfirmModal";
import type { Sangaku, Shrine } from "@/app/lib/definitions";

// kind: "code" のとき、既存どおりソースコード（Monaco）と解答チェック用入力を
// 表示することを固定化する回帰防止テスト（reorder kind の表示は次サイクルの対象）。
//
// Monaco Editor（@monaco-editor/react）は playwright-ct.config.ts の Vite alias で
// tests/__mocks__/monaco-editor.tsx に差し替えられ、data-testid="monaco-editor" の
// <div> として value をそのままテキスト描画する。
//
// MUI Modal は React Portal で document.body 直下にレンダリングされるため、
// マウント済みコンポーネントのルート配下に限定される component.getByTestId/getByRole
// ではなく、ページ全体を対象にする page.getByTestId/getByRole を使う。

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

// kind: "reorder" のとき、一覧APIから渡される data には code_blocks が含まれない
// （back の設計: 一覧レスポンスは code_blocks を返さない）。
// ConfirmModal は data.attributes.kind === "reorder" を検知すると
// fetchUserSangaku(data.id)（"use server" のクライアントコンポーネントからの直接呼び出し）
// で詳細データ（code_blocks込み）を取得し、それを表示に使う想定。
//
// fetchUserSangaku は @/app/lib/data/sangaku ごと playwright-ct.config.ts の Vite alias で
// tests/__mocks__/data/sangaku.ts に差し替えられる。同モックは他の *_id を無視する
// 既存モック（fetchUserAnswer, fetchShrine 等）と同様に id によらず固定のフィクスチャ
// （kind: "reorder"、code_blocks に正解ブロック2件+ダミー1件）を返す。
// このフィクスチャの content は reorderSangaku（一覧データ）には含まれない値のため、
// 画面にその content が表示されること自体が fetchUserSangaku の返り値が
// 使われたことの検証になる。
const reorderSangaku: Sangaku = {
  id: "2",
  type: "sangaku",
  attributes: {
    title: "reorder_list_title",
    description: "reorder_list_desc",
    difficulty: "normal",
    kind: "reorder",
    inputs: [],
    author_name: "test_author",
    // 一覧APIのレスポンスを模しているため code_blocks は含めない
  },
  relationships: {
    user: { data: { id: "1", type: "user" } },
    shrine: { data: null },
  },
};

const codeSangaku: Sangaku = {
  id: "1",
  type: "sangaku",
  attributes: {
    title: "test_title",
    description: "test_desc",
    source: "puts 'hello'",
    difficulty: "normal",
    kind: "code",
    inputs: [
      { id: 1, content: "input_1" },
      { id: 2, content: "input_2" },
    ],
    author_name: "test_author",
  },
  relationships: {
    user: { data: { id: "1", type: "user" } },
    shrine: { data: null },
  },
};

test.describe("ConfirmModal", () => {
  test("should allow me to see the source code in a read-only Monaco editor when kind is code", async ({
    mount,
    page,
  }) => {
    // Arrange & Act
    await mount(
      <ConfirmModal data={codeSangaku} shrine={shrine} handleClose={() => {}} />,
    );

    // Assert
    await expect(page.getByTestId("monaco-editor")).toBeVisible();
    await expect(page.getByTestId("monaco-editor")).toHaveText(
      "puts 'hello'",
    );
  });

  test("should allow me to see 解答チェック用入力 list with each input's content when kind is code", async ({
    mount,
    page,
  }) => {
    // Arrange & Act
    await mount(
      <ConfirmModal data={codeSangaku} shrine={shrine} handleClose={() => {}} />,
    );

    // Assert
    await expect(page.getByText("解答チェック用入力")).toBeVisible();
    await expect(page.getByLabel("result-1")).toHaveText("input_1");
    await expect(page.getByLabel("result-2")).toHaveText("input_2");
  });

  test("should allow me to see correct code blocks numbered by correct_position when kind is reorder", async ({
    mount,
    page,
  }) => {
    // Arrange & Act
    await mount(
      <ConfirmModal
        data={reorderSangaku}
        shrine={shrine}
        handleClose={() => {}}
      />,
    );

    // Assert
    // 期待する実装: reorderSangaku（一覧データ、code_blocks なし）を渡すと
    // fetchUserSangaku(data.id) の結果（モックの固定フィクスチャ）を使い、
    // 正解ブロック（correct_position 昇順で並んでいる想定）を
    // data-testid="confirm-modal-code-block-{1-based index}" のコンテナに
    // correct_position の数値ラベルと content を表示する。
    const block1 = page.getByTestId("confirm-modal-code-block-1");
    await expect(block1).toBeVisible();
    await expect(block1.getByText("1", { exact: true })).toBeVisible();
    await expect(block1).toContainText("block_content_1");

    const block2 = page.getByTestId("confirm-modal-code-block-2");
    await expect(block2).toBeVisible();
    await expect(block2.getByText("2", { exact: true })).toBeVisible();
    await expect(block2).toContainText("block_content_2");
  });

  test("should allow me to see dummy code blocks labeled as ダミー when kind is reorder", async ({
    mount,
    page,
  }) => {
    // Arrange & Act
    await mount(
      <ConfirmModal
        data={reorderSangaku}
        shrine={shrine}
        handleClose={() => {}}
      />,
    );

    // Assert
    // 期待する実装: correct_position が null のブロック（ダミー）は
    // 番号の代わりに「ダミー」ラベルを表示する。
    const dummyBlock = page.getByTestId("confirm-modal-code-block-3");
    await expect(dummyBlock).toBeVisible();
    await expect(dummyBlock.getByText("ダミー", { exact: true })).toBeVisible();
    await expect(dummyBlock).toContainText("dummy_block_content");
  });
});
