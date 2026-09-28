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

  test("should allow me to see the description positioned to the left of the code blocks when kind is reorder and viewport is sm or wider", async ({
    mount,
    page,
  }) => {
    // Arrange
    await page.setViewportSize({ width: 1000, height: 800 });

    // Act
    await mount(
      <ConfirmModal
        data={reorderSangaku}
        shrine={shrine}
        handleClose={() => {}}
      />,
    );

    // Assert
    const codeBlock = page.getByTestId("confirm-modal-code-block-1");
    await expect(codeBlock).toBeVisible();
    const description = page.getByTestId("confirm-modal-description");
    await expect(description).toBeVisible();

    const descriptionBox = await description.boundingBox();
    const codeBlockBox = await codeBlock.boundingBox();
    expect(descriptionBox).not.toBeNull();
    expect(codeBlockBox).not.toBeNull();

    // 実装が縦積み（description の x座標が code block 以上）に変わった場合に
    // このテストのみで検知できるよう分割した回帰防止テスト（説明文が左、コードブロックが右）
    expect(descriptionBox!.x).toBeLessThan(codeBlockBox!.x);
  });

  test("should allow me to see the description and code blocks start at the same vertical position when kind is reorder and viewport is sm or wider", async ({
    mount,
    page,
  }) => {
    // Arrange
    await page.setViewportSize({ width: 1000, height: 800 });

    // Act
    await mount(
      <ConfirmModal
        data={reorderSangaku}
        shrine={shrine}
        handleClose={() => {}}
      />,
    );

    // Assert
    const codeBlock = page.getByTestId("confirm-modal-code-block-1");
    await expect(codeBlock).toBeVisible();
    const description = page.getByTestId("confirm-modal-description");
    await expect(description).toBeVisible();

    const descriptionBox = await description.boundingBox();
    const codeBlockBox = await codeBlock.boundingBox();
    expect(descriptionBox).not.toBeNull();
    expect(codeBlockBox).not.toBeNull();

    // 実装が縦積みレイアウトに変わり y座標が大きくずれた場合に
    // このテストのみで検知できるよう分割した回帰防止テスト（縦にほぼ同じ位置から始まる＝縦積みでないこと）
    expect(Math.abs(descriptionBox!.y - codeBlockBox!.y)).toBeLessThan(10);
  });

  test("should allow me to see the description and code blocks side by side at the sm breakpoint (600px) when kind is reorder", async ({
    mount,
    page,
  }) => {
    // Arrange
    await page.setViewportSize({ width: 600, height: 800 });

    // Act
    await mount(
      <ConfirmModal
        data={reorderSangaku}
        shrine={shrine}
        handleClose={() => {}}
      />,
    );

    // Assert
    const codeBlock = page.getByTestId("confirm-modal-code-block-1");
    await expect(codeBlock).toBeVisible();
    const description = page.getByTestId("confirm-modal-description");
    await expect(description).toBeVisible();

    const descriptionBox = await description.boundingBox();
    const codeBlockBox = await codeBlock.boundingBox();
    expect(descriptionBox).not.toBeNull();
    expect(codeBlockBox).not.toBeNull();

    // sm ブレークポイント境界値（600px）で MUI の sm 以上判定が
    // 想定通り働いていない場合（例: 実装が md 基準の場合）に検知する境界値テスト
    expect(descriptionBox!.x).toBeLessThan(codeBlockBox!.x);
  });

  test("should allow me to see the description rendered as Markdown inside a primary.main container when kind is code", async ({
    mount,
    page,
  }) => {
    // Arrange
    const markdownCodeSangaku: Sangaku = {
      ...codeSangaku,
      attributes: {
        ...codeSangaku.attributes,
        description: "**bold_desc**",
      },
    };

    // Act
    await mount(
      <ConfirmModal
        data={markdownCodeSangaku}
        shrine={shrine}
        handleClose={() => {}}
      />,
    );

    // Assert
    const description = page.getByTestId("confirm-modal-description");
    await expect(description.locator("strong")).toHaveText("bold_desc");
    await expect(description).toHaveCSS(
      "background-color",
      "rgb(244, 206, 147)",
    );
  });

  test("should allow me to see the description rendered as Markdown inside a primary.main container when kind is reorder", async ({
    mount,
    page,
  }) => {
    // Arrange
    const markdownReorderSangaku: Sangaku = {
      ...reorderSangaku,
      attributes: {
        ...reorderSangaku.attributes,
        description: "**bold_desc**",
      },
    };

    // Act
    await mount(
      <ConfirmModal
        data={markdownReorderSangaku}
        shrine={shrine}
        handleClose={() => {}}
      />,
    );

    // Assert
    const description = page.getByTestId("confirm-modal-description");
    await expect(description.locator("strong")).toHaveText("bold_desc");
    await expect(description).toHaveCSS(
      "background-color",
      "rgb(244, 206, 147)",
    );
  });

  // --- ダイアログの高さ固定・ボタン固定・カラム個別スクロール ---
  // 問題文カラムが確実に溢れるよう、十分に長い問題文を持つ算額
  const longDescription = Array.from({ length: 40 }, (_, i) => `line_${i}`).join(
    "\n\n",
  );
  const longCodeSangaku: Sangaku = {
    ...codeSangaku,
    attributes: { ...codeSangaku.attributes, description: longDescription },
  };
  const longReorderSangaku: Sangaku = {
    ...reorderSangaku,
    attributes: { ...reorderSangaku.attributes, description: longDescription },
  };

  for (const kind of ["code", "reorder"] as const) {
    const sangaku = kind === "code" ? codeSangaku : reorderSangaku;

    test(`should allow me to see the dialog height fixed to 85% of the viewport height when kind is ${kind}`, async ({
      mount,
      page,
    }) => {
      // Arrange
      await page.setViewportSize({ width: 1000, height: 800 });

      // Act
      await mount(
        <ConfirmModal data={sangaku} shrine={shrine} handleClose={() => {}} />,
      );

      // Assert
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      const box = await dialog.boundingBox();
      expect(box).not.toBeNull();
      expect(Math.abs(box!.height - 800 * 0.85)).toBeLessThanOrEqual(1);
    });

    test(`should allow me to see the buttons stay within the dialog bottom when content overflows in a low viewport and kind is ${kind}`, async ({
      mount,
      page,
    }) => {
      // Arrange
      await page.setViewportSize({ width: 1000, height: 250 });

      // Act
      await mount(
        <ConfirmModal data={sangaku} shrine={shrine} handleClose={() => {}} />,
      );

      // Assert
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      const backButton = page.getByRole("button", { name: "戻る" });
      const submitButton = page.getByRole("button", {
        name: "この算額を奉納する",
      });
      await expect(backButton).toBeVisible();
      await expect(submitButton).toBeVisible();

      const dialogBox = await dialog.boundingBox();
      const backBox = await backButton.boundingBox();
      const submitBox = await submitButton.boundingBox();
      expect(dialogBox).not.toBeNull();
      expect(backBox).not.toBeNull();
      expect(submitBox).not.toBeNull();
      const dialogBottom = dialogBox!.y + dialogBox!.height;
      expect(backBox!.y + backBox!.height).toBeLessThanOrEqual(dialogBottom);
      expect(submitBox!.y + submitBox!.height).toBeLessThanOrEqual(
        dialogBottom,
      );
      // ボタンが画面（viewport 高 250px）の外へはみ出さない
      expect(backBox!.y + backBox!.height).toBeLessThanOrEqual(250);
      expect(submitBox!.y + submitBox!.height).toBeLessThanOrEqual(250);
    });
  }

  test("should allow me to scroll the description column individually when content overflows in a low viewport and kind is code", async ({
    mount,
    page,
  }) => {
    // Arrange
    await page.setViewportSize({ width: 1000, height: 250 });

    // Act
    await mount(
      <ConfirmModal data={longCodeSangaku} shrine={shrine} handleClose={() => {}} />,
    );

    // Assert
    const column = page.getByTestId("confirm-modal-description-column");
    await expect(column).toBeAttached();
    await expect(column).toHaveCSS("overflow-y", "auto");
    const scrollable = await column.evaluate(
      (el) => el.scrollHeight > el.clientHeight,
    );
    expect(scrollable).toBe(true);
  });

  test("should allow me to scroll the description column individually when content overflows in a low viewport and kind is reorder", async ({
    mount,
    page,
  }) => {
    // Arrange
    await page.setViewportSize({ width: 1000, height: 250 });

    // Act
    await mount(
      <ConfirmModal
        data={longReorderSangaku}
        shrine={shrine}
        handleClose={() => {}}
      />,
    );

    // Assert
    const column = page.getByTestId("confirm-modal-description-column");
    await expect(column).toBeAttached();
    await expect(column).toHaveCSS("overflow-y", "auto");
    const scrollable = await column.evaluate(
      (el) => el.scrollHeight > el.clientHeight,
    );
    expect(scrollable).toBe(true);
  });

  test("should allow me to scroll the code blocks column individually when content overflows in a low viewport and kind is reorder", async ({
    mount,
    page,
  }) => {
    // Arrange
    await page.setViewportSize({ width: 1000, height: 250 });

    // Act
    await mount(
      <ConfirmModal
        data={reorderSangaku}
        shrine={shrine}
        handleClose={() => {}}
      />,
    );

    // Assert
    await expect(page.getByTestId("confirm-modal-code-block-1")).toBeAttached();
    const column = page.getByTestId("confirm-modal-code-blocks");
    await expect(column).toBeAttached();
    await expect(column).toHaveCSS("overflow-y", "auto");
    const scrollable = await column.evaluate(
      (el) => el.scrollHeight > el.clientHeight,
    );
    expect(scrollable).toBe(true);
  });

  test("should allow me to see the description container fill the column height when kind is reorder", async ({
    mount,
    page,
  }) => {
    // Arrange
    await page.setViewportSize({ width: 1000, height: 800 });

    // Act
    await mount(
      <ConfirmModal
        data={reorderSangaku}
        shrine={shrine}
        handleClose={() => {}}
      />,
    );

    // Assert
    const description = page.getByTestId("confirm-modal-description");
    await expect(description).toBeVisible();
    const column = page.getByTestId("confirm-modal-description-column");
    await expect(column).toBeVisible();

    const descriptionBox = await description.boundingBox();
    const columnBox = await column.boundingBox();
    expect(descriptionBox).not.toBeNull();
    expect(columnBox).not.toBeNull();

    // reorder の description コンテナも code kind と同様 flexGrow を持ち、
    // 短い description でもカラムいっぱいまで背景色ボックスが伸びることを確認する
    expect(descriptionBox!.height).toBeGreaterThanOrEqual(
      columnBox!.height * 0.9,
    );
  });

  test("should allow me to see three skeleton rows instead of loading text while code blocks are loading when kind is reorder", async ({
    mount,
    page,
  }) => {
    // Act
    // fetchUserSangaku はテストファイルとは別モジュールインスタンスとして
    // ブラウザ側でバンドルされるため、hooksConfig 経由で
    // playwright/index.tsx の beforeMount から遅延を設定する
    // （fetchUserSangakuDelay を直接 import して書き換えても反映されない）。
    await mount(
      <ConfirmModal
        data={reorderSangaku}
        shrine={shrine}
        handleClose={() => {}}
      />,
      { hooksConfig: { fetchUserSangakuDelayMs: 2000 } },
    );

    // Assert
    const loadingContainer = page.getByTestId(
      "confirm-modal-code-blocks-loading",
    );
    await expect(loadingContainer).toBeVisible();
    await expect(loadingContainer.locator(".MuiSkeleton-root")).toHaveCount(
      3,
    );
    await expect(page.getByText("読み込み中")).toHaveCount(0);
  });
});
