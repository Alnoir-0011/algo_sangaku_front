import { Locator, Page } from "@playwright/test";
import { test, expect } from "@/tests/fixtures.ct";
import ReorderPuzzle from "@/app/ui/sangaku/reorder/ReorderPuzzle";

// WebKit では Locator.dragTo(target) がドロップ時に target ロケーターを
// 再評価するため、ドラッグ中の @dnd-kit のレイアウトアニメーションで
// DOM 位置がずれ、ドロップ座標が意図した要素からずれてしまう不具合がある
// （Chromium では発生しない）。boundingBox() で座標を事前に固定し、
// page.mouse で手動操作することでブラウザ間の挙動差をなくす。
// この不具合は同一コンテナ内の並べ替え（ドロップ先が他ブロックの上）で
// 顕著に再現するが、コンテナ間移動（ドロップ先がエリア全体の広い領域）でも
// 原理上同じ再評価ずれのリスクを抱えるため、本ファイルの D&D テスト全4件で
// dragTo ではなくこのヘルパーに統一する。
async function dragLocatorTo(page: Page, source: Locator, target: Locator) {
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();
  if (!sourceBox || !targetBox) {
    throw new Error("drag element bounding box not found");
  }
  await page.mouse.move(
    sourceBox.x + sourceBox.width / 2,
    sourceBox.y + sourceBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    targetBox.x + targetBox.width / 2,
    targetBox.y + targetBox.height / 2,
    { steps: 20 },
  );
  await page.mouse.up();
}

// back側の PublicSangakuDetailSerializer が返す code_blocks は
// { id: number, content: string }[] のみ（correct_position やダミー判定は含まれない）。
// definitions.ts の CodeBlock 型（answerer 向け）に合わせ、id/content のみを渡す。
const blocks = [
  { id: 1, content: "puts 1" },
  { id: 2, content: "puts 2" },
  { id: 3, content: "puts 3" },
];

// ReorderPuzzle のタイトル・問題文表示に使う props。全テストで共通の値を渡す。
const title = "並べ替え問題のタイトル";
const description = "これは並べ替え問題の問題文です";

// レイアウトの列構成（Grid の columns / size 指定によるデスクトップ2カラム・
// スマホ1カラムのレスポンシブ表示）は Playwright Component Testing の
// ビューポート制約上、厳密な検証が難しいためここではテストしない。
// 実際の見た目（md 未満で縦積み、md 以上で2カラム）の確認は F4a（ブラウザ目視）で行う。

test.describe("ReorderPuzzle", () => {
  test("should allow me to see all block contents in the unused area when the component is initially rendered", async ({
    mount,
  }) => {
    // Arrange & Act
    const component = await mount(<ReorderPuzzle
        sangakuId="1"
        blocks={blocks}
        title={title}
        description={description}
      />);

    // Assert
    const unusedArea = component.getByTestId("unused-blocks-area");
    await expect(unusedArea.getByText("puts 1")).toBeVisible();
    await expect(unusedArea.getByText("puts 2")).toBeVisible();
    await expect(unusedArea.getByText("puts 3")).toBeVisible();
  });

  test("should allow me to move a block to the answer area when clicking the move-to-answer button", async ({
    mount,
  }) => {
    // Arrange
    const component = await mount(<ReorderPuzzle
        sangakuId="1"
        blocks={blocks}
        title={title}
        description={description}
      />);
    const unusedArea = component.getByTestId("unused-blocks-area");
    const answerArea = component.getByTestId("answer-blocks-area");

    // Act
    await unusedArea
      .getByText("puts 2")
      .getByRole("button", { name: "解答エリアへ移動" })
      .click();

    // Assert
    await expect(answerArea.getByText("puts 2")).toBeVisible();
    await expect(unusedArea.getByText("puts 2")).toHaveCount(0);
  });

  test("should allow me to append a second moved block after an already-moved block in the answer area", async ({
    mount,
  }) => {
    // Arrange
    const component = await mount(<ReorderPuzzle
        sangakuId="1"
        blocks={blocks}
        title={title}
        description={description}
      />);
    const unusedArea = component.getByTestId("unused-blocks-area");
    const answerArea = component.getByTestId("answer-blocks-area");

    // Act
    await unusedArea
      .getByText("puts 2")
      .getByRole("button", { name: "解答エリアへ移動" })
      .click();
    await unusedArea
      .getByText("puts 1")
      .getByRole("button", { name: "解答エリアへ移動" })
      .click();

    // Assert
    await expect(answerArea.getByTestId("block-item")).toHaveText([
      "puts 2",
      "puts 1",
    ]);
  });

  test("should allow me to move a block back to the unused area when clicking the return-to-unused button", async ({
    mount,
  }) => {
    // Arrange
    const component = await mount(<ReorderPuzzle
        sangakuId="1"
        blocks={blocks}
        title={title}
        description={description}
      />);
    const unusedArea = component.getByTestId("unused-blocks-area");
    const answerArea = component.getByTestId("answer-blocks-area");
    await unusedArea
      .getByText("puts 2")
      .getByRole("button", { name: "解答エリアへ移動" })
      .click();
    await unusedArea
      .getByText("puts 1")
      .getByRole("button", { name: "解答エリアへ移動" })
      .click();

    // Act
    await answerArea
      .getByText("puts 2")
      .getByRole("button", { name: "利用しないエリアへ戻す" })
      .click();

    // Assert
    await expect(unusedArea.getByText("puts 2")).toBeVisible();
    await expect(answerArea.getByText("puts 2")).toHaveCount(0);
    await expect(answerArea.getByText("puts 1")).toBeVisible();
  });

  test("should allow me to reorder blocks in the answer area when clicking the move-up button on a middle block", async ({
    mount,
  }) => {
    // Arrange
    const component = await mount(<ReorderPuzzle
        sangakuId="1"
        blocks={blocks}
        title={title}
        description={description}
      />);
    const unusedArea = component.getByTestId("unused-blocks-area");
    const answerArea = component.getByTestId("answer-blocks-area");
    await unusedArea
      .getByText("puts 1")
      .getByRole("button", { name: "解答エリアへ移動" })
      .click();
    await unusedArea
      .getByText("puts 2")
      .getByRole("button", { name: "解答エリアへ移動" })
      .click();
    await unusedArea
      .getByText("puts 3")
      .getByRole("button", { name: "解答エリアへ移動" })
      .click();

    // Act
    await answerArea
      .getByText("puts 2")
      .getByRole("button", { name: "上へ" })
      .click();

    // Assert
    await expect(answerArea.getByTestId("block-item")).toHaveText([
      "puts 2",
      "puts 1",
      "puts 3",
    ]);
  });

  test("should allow me to reorder blocks in the answer area when clicking the move-down button on a middle block", async ({
    mount,
  }) => {
    // Arrange
    const component = await mount(<ReorderPuzzle
        sangakuId="1"
        blocks={blocks}
        title={title}
        description={description}
      />);
    const unusedArea = component.getByTestId("unused-blocks-area");
    const answerArea = component.getByTestId("answer-blocks-area");
    await unusedArea
      .getByText("puts 1")
      .getByRole("button", { name: "解答エリアへ移動" })
      .click();
    await unusedArea
      .getByText("puts 2")
      .getByRole("button", { name: "解答エリアへ移動" })
      .click();
    await unusedArea
      .getByText("puts 3")
      .getByRole("button", { name: "解答エリアへ移動" })
      .click();

    // Act
    await answerArea
      .getByText("puts 2")
      .getByRole("button", { name: "下へ" })
      .click();

    // Assert
    // puts 1, puts 2, puts 3 の並びから puts 2 を「下へ」で
    // puts 1, puts 3, puts 2 の順になることを確認する
    await expect(answerArea.getByTestId("block-item")).toHaveText([
      "puts 1",
      "puts 3",
      "puts 2",
    ]);
  });

  test("should not allow me to click the move-up button when the block is at the top of the answer area", async ({
    mount,
  }) => {
    // Arrange
    const component = await mount(<ReorderPuzzle
        sangakuId="1"
        blocks={blocks}
        title={title}
        description={description}
      />);
    const unusedArea = component.getByTestId("unused-blocks-area");
    const answerArea = component.getByTestId("answer-blocks-area");
    await unusedArea
      .getByText("puts 1")
      .getByRole("button", { name: "解答エリアへ移動" })
      .click();
    await unusedArea
      .getByText("puts 2")
      .getByRole("button", { name: "解答エリアへ移動" })
      .click();

    // Assert
    const moveUpButtonOnFirstBlock = answerArea
      .getByText("puts 1")
      .getByRole("button", { name: "上へ" });
    await expect(moveUpButtonOnFirstBlock).toBeDisabled();
  });

  test("should not allow me to click the move-down button when the block is at the bottom of the answer area", async ({
    mount,
  }) => {
    // Arrange
    const component = await mount(<ReorderPuzzle
        sangakuId="1"
        blocks={blocks}
        title={title}
        description={description}
      />);
    const unusedArea = component.getByTestId("unused-blocks-area");
    const answerArea = component.getByTestId("answer-blocks-area");
    await unusedArea
      .getByText("puts 1")
      .getByRole("button", { name: "解答エリアへ移動" })
      .click();
    await unusedArea
      .getByText("puts 2")
      .getByRole("button", { name: "解答エリアへ移動" })
      .click();

    // Assert
    const moveDownButtonOnLastBlock = answerArea
      .getByText("puts 2")
      .getByRole("button", { name: "下へ" });
    await expect(moveDownButtonOnLastBlock).toBeDisabled();
  });

  test("should not allow me to submit when the answer area is empty", async ({
    mount,
  }) => {
    // Arrange & Act
    const component = await mount(<ReorderPuzzle
        sangakuId="1"
        blocks={blocks}
        title={title}
        description={description}
      />);

    // Assert
    const submitButton = component.getByRole("button", {
      name: "解答を終了する",
    });
    await expect(submitButton).toBeDisabled();
  });

  test("should allow me to submit when the answer area has at least one block", async ({
    mount,
  }) => {
    // Arrange
    const component = await mount(<ReorderPuzzle
        sangakuId="1"
        blocks={blocks}
        title={title}
        description={description}
      />);
    const unusedArea = component.getByTestId("unused-blocks-area");

    // Act
    await unusedArea
      .getByText("puts 1")
      .getByRole("button", { name: "解答エリアへ移動" })
      .click();

    // Assert
    const submitButton = component.getByRole("button", {
      name: "解答を終了する",
    });
    await expect(submitButton).toBeEnabled();
  });

  test("should allow me to send block_ids in answer area order when clicking the end-answer button", async ({
    mount,
    page,
  }) => {
    // Arrange
    // CreateForm.tsx と同様、実装は window.confirm での確認後に createAnswer を
    // 呼ぶ想定。addInitScript による window.confirm の上書きは Playwright CT環境では
    // 反映されず、ブラウザ標準のダイアログイベントとして扱われる（実測で確認済み）。
    // 既存の E2E テスト（answer/create/page.spec.ts）と同様に page.on("dialog") で
    // ネイティブダイアログを直接ハンドルする。
    page.on("dialog", (dialog) => dialog.accept());
    const component = await mount(
      <ReorderPuzzle
        sangakuId="1"
        blocks={blocks}
        title={title}
        description={description}
      />,
    );
    const unusedArea = component.getByTestId("unused-blocks-area");
    await unusedArea
      .getByText("puts 2")
      .getByRole("button", { name: "解答エリアへ移動" })
      .click();
    await unusedArea
      .getByText("puts 3")
      .getByRole("button", { name: "解答エリアへ移動" })
      .click();
    await unusedArea
      .getByText("puts 1")
      .getByRole("button", { name: "解答エリアへ移動" })
      .click();

    // Act
    await component.getByRole("button", { name: "解答を終了する" }).click();

    // Assert
    await expect
      .poll(() =>
        page.evaluate(() => window.__createAnswerCalls?.length ?? 0),
      )
      .toBeGreaterThan(0);
    const calls = await page.evaluate(() => window.__createAnswerCalls);
    const lastCall = calls?.[calls.length - 1];
    expect(lastCall?.sangakuId).toBe("1");
    expect(lastCall?.payload).toEqual({ block_ids: [2, 3, 1] });
  });

  test("should allow me to see the title as a heading when the title prop is given", async ({
    mount,
  }) => {
    // Arrange & Act
    const component = await mount(
      <ReorderPuzzle
        sangakuId="1"
        blocks={blocks}
        title={title}
        description={description}
      />,
    );

    // Assert
    await expect(
      component.getByRole("heading", { name: title }),
    ).toBeVisible();
  });

  test("should allow me to see the description text in the problem statement area when the description prop is given", async ({
    mount,
  }) => {
    // Arrange & Act
    const component = await mount(
      <ReorderPuzzle
        sangakuId="1"
        blocks={blocks}
        title={title}
        description={description}
      />,
    );

    // Assert
    await expect(component.getByText(description)).toBeVisible();
  });

  test("should allow me to move a block to the answer area when dragging it from the unused area", async ({
    mount,
    page,
  }) => {
    // D&D（onDragOver によるコンテナ間移動）で unused → answer にブロックが
    // 移動することを検証する。dragLocatorTo を使う理由は下記 dragLocatorTo の
    // コメントを参照。
    // Arrange
    const component = await mount(<ReorderPuzzle
        sangakuId="1"
        blocks={blocks}
        title={title}
        description={description}
      />);
    const unusedArea = component.getByTestId("unused-blocks-area");
    const answerArea = component.getByTestId("answer-blocks-area");
    const dragHandle = unusedArea
      .getByText("puts 2")
      .getByTestId("drag-handle");

    // Act
    await dragLocatorTo(page, dragHandle, answerArea);

    // Assert
    await expect(answerArea.getByText("puts 2")).toBeVisible();
    await expect(unusedArea.getByText("puts 2")).toHaveCount(0);
  });

  test("should allow me to move a block to the answer area when dragging it from anywhere in the block other than the drag handle icon", async ({
    mount,
    page,
  }) => {
    // ドラッグ開始点がハンドルアイコンに限定されず、ブロック内容のテキスト
    // 部分を掴んでも移動できることを検証する（アイコン部分でしか D&D が
    // 機能しない不具合の回帰テスト）。
    // Arrange
    const component = await mount(<ReorderPuzzle
        sangakuId="1"
        blocks={blocks}
        title={title}
        description={description}
      />);
    const unusedArea = component.getByTestId("unused-blocks-area");
    const answerArea = component.getByTestId("answer-blocks-area");
    const blockContent = unusedArea.getByText("puts 2");

    // Act: アイコン（drag-handle）ではなく、ブロック内容のテキスト自体を掴む
    await dragLocatorTo(page, blockContent, answerArea);

    // Assert
    await expect(answerArea.getByText("puts 2")).toBeVisible();
    await expect(unusedArea.getByText("puts 2")).toHaveCount(0);
  });

  test("should not allow me to start dragging a block when pressing down on an action button", async ({
    mount,
    page,
  }) => {
    // 右側のアクションボタン（「解答エリアへ移動」等）を掴んでもドラッグが
    // 開始されず、ボタン本来のクリック操作のみが実行されることを検証する。
    // Arrange
    const component = await mount(<ReorderPuzzle
        sangakuId="1"
        blocks={blocks}
        title={title}
        description={description}
      />);
    const unusedArea = component.getByTestId("unused-blocks-area");
    const answerArea = component.getByTestId("answer-blocks-area");
    const moveButton = unusedArea
      .getByText("puts 2")
      .getByRole("button", { name: "解答エリアへ移動" });

    // Act: ボタンの上から解答エリアへドラッグを試みる
    await dragLocatorTo(page, moveButton, answerArea);

    // Assert: ドラッグでは移動せず、未使用エリアに残ったままになる
    await expect(unusedArea.getByText("puts 2")).toBeVisible();
    await expect(answerArea.getByText("puts 2")).toHaveCount(0);
  });

  test("should allow me to insert a block at the position it is dropped on when dragging it from the unused area into the middle of the answer area", async ({
    mount,
    page,
  }) => {
    // D&D でコンテナをまたいで移動する際、常に末尾へ追加するのではなく、
    // ドロップ先のブロックの位置に挿入されることを検証する（quick-review 指摘:
    // ドラッグ中の視覚的な挿入位置と最終結果が一致しない問題の回帰テスト）。
    // Arrange
    const component = await mount(<ReorderPuzzle
        sangakuId="1"
        blocks={blocks}
        title={title}
        description={description}
      />);
    const unusedArea = component.getByTestId("unused-blocks-area");
    const answerArea = component.getByTestId("answer-blocks-area");
    await unusedArea
      .getByText("puts 1")
      .getByRole("button", { name: "解答エリアへ移動" })
      .click();
    await unusedArea
      .getByText("puts 2")
      .getByRole("button", { name: "解答エリアへ移動" })
      .click();
    // 解答エリアは puts 1, puts 2 の順。未使用エリアに残る puts 3 を
    // puts 1 の上（先頭）にドラッグする。
    const dragHandle = unusedArea
      .getByText("puts 3")
      .getByTestId("drag-handle");
    const firstBlockDragHandle = answerArea
      .getByText("puts 1")
      .getByTestId("drag-handle");

    // Act
    await dragLocatorTo(page, dragHandle, firstBlockDragHandle);

    // Assert
    await expect(answerArea.getByTestId("block-item")).toHaveText([
      "puts 3",
      "puts 1",
      "puts 2",
    ]);
  });

  test("should allow me to reorder blocks within the answer area when dragging the last block to the first position", async ({
    mount,
    page,
  }) => {
    // 同一コンテナ内での並べ替え（onDragEnd による answer エリア内の arrayMove）で、
    // 末尾ブロックを先頭にドラッグすると順序が入れ替わることを検証する。
    // Arrange
    const component = await mount(<ReorderPuzzle
        sangakuId="1"
        blocks={blocks}
        title={title}
        description={description}
      />);
    const unusedArea = component.getByTestId("unused-blocks-area");
    const answerArea = component.getByTestId("answer-blocks-area");
    await unusedArea
      .getByText("puts 1")
      .getByRole("button", { name: "解答エリアへ移動" })
      .click();
    await unusedArea
      .getByText("puts 2")
      .getByRole("button", { name: "解答エリアへ移動" })
      .click();
    await unusedArea
      .getByText("puts 3")
      .getByRole("button", { name: "解答エリアへ移動" })
      .click();
    const lastBlockDragHandle = answerArea
      .getByText("puts 3")
      .getByTestId("drag-handle");
    const firstBlockDragHandle = answerArea
      .getByText("puts 1")
      .getByTestId("drag-handle");

    // Act
    await dragLocatorTo(page, lastBlockDragHandle, firstBlockDragHandle);

    // Assert
    await expect(answerArea.getByTestId("block-item")).toHaveText([
      "puts 3",
      "puts 1",
      "puts 2",
    ]);
  });

  test("should allow me to move a block back to the unused area when dragging it from the answer area", async ({
    mount,
    page,
  }) => {
    // D&D（onDragOver によるコンテナ間移動）で answer → unused にブロックが
    // 戻ることを検証する（上記 unused → answer のテストと対になる分岐）。
    // Arrange
    const component = await mount(<ReorderPuzzle
        sangakuId="1"
        blocks={blocks}
        title={title}
        description={description}
      />);
    const unusedArea = component.getByTestId("unused-blocks-area");
    const answerArea = component.getByTestId("answer-blocks-area");
    await unusedArea
      .getByText("puts 2")
      .getByRole("button", { name: "解答エリアへ移動" })
      .click();
    const dragHandle = answerArea
      .getByText("puts 2")
      .getByTestId("drag-handle");

    // Act
    await dragLocatorTo(page, dragHandle, unusedArea);

    // Assert
    await expect(unusedArea.getByText("puts 2")).toBeVisible();
    await expect(answerArea.getByText("puts 2")).toHaveCount(0);
  });

  test("should allow me to reorder blocks within the unused area when dragging the last block to the first position", async ({
    mount,
    page,
  }) => {
    // handleDragEnd はコンテナの種類（unused/answer）に依存しない汎用実装のため、
    // 「解答エリア内の並べ替え」（同一コンテナ内の arrayMove）ロジックが unused
    // エリアでも同様に動作することを保証する回帰ガードとして機能する。
    // Arrange
    const component = await mount(<ReorderPuzzle
        sangakuId="1"
        blocks={blocks}
        title={title}
        description={description}
      />);
    const unusedArea = component.getByTestId("unused-blocks-area");
    // unused エリアの初期表示順は front 側でシャッフルされる（quick-review 対応）ため、
    // ブロック内容を決め打ちせず、DOM 上の並びから先頭・末尾を動的に取得する。
    const initialTexts = await unusedArea
      .getByTestId("block-item")
      .allTextContents();
    const [firstContent, ...middleContents] = initialTexts;
    const lastContent = initialTexts[initialTexts.length - 1];
    const lastBlockDragHandle = unusedArea
      .getByText(lastContent)
      .getByTestId("drag-handle");
    const firstBlockDragHandle = unusedArea
      .getByText(firstContent)
      .getByTestId("drag-handle");

    // Act
    await dragLocatorTo(page, lastBlockDragHandle, firstBlockDragHandle);

    // Assert
    await expect(unusedArea.getByTestId("block-item")).toHaveText([
      lastContent,
      firstContent,
      ...middleContents.slice(0, -1),
    ]);
  });

  test.describe("when the onSubmit prop is given", () => {
    // Playwright CT では mount の props に渡した関数コールバックは
    // テスト側（Node）のスコープで実行されるため、テスト内のローカル配列に記録できる。
    // ゲスト解答フローは保存を経由しない送信処理へ差し替えるため、
    // onSubmit が渡されたときは確認ダイアログも createAnswer も使わない。
    async function moveBlocksToAnswerArea(
      component: Locator,
      contents: string[],
    ) {
      const unusedArea = component.getByTestId("unused-blocks-area");
      for (const content of contents) {
        await unusedArea
          .getByText(content)
          .getByRole("button", { name: "解答エリアへ移動" })
          .click();
      }
    }

    test("should allow me to call onSubmit once with block_ids in answer area order when clicking the end-answer button", async ({
      mount,
      page,
    }) => {
      // Arrange
      // onSubmit 未対応の実装では window.confirm が出て待ち続けるため、
      // ダイアログは accept して先へ進める。
      page.on("dialog", (dialog) => dialog.accept());
      const submittedBlockIds: number[][] = [];
      const component = await mount(
        <ReorderPuzzle
          sangakuId="1"
          blocks={blocks}
          title={title}
          description={description}
          onSubmit={(blockIds) => {
            submittedBlockIds.push(blockIds);
          }}
        />,
      );
      await moveBlocksToAnswerArea(component, ["puts 2", "puts 3", "puts 1"]);

      // Act
      await component.getByRole("button", { name: "解答を終了する" }).click();

      // Assert
      await expect.poll(() => submittedBlockIds.length).toBe(1);
      expect(submittedBlockIds[0]).toEqual([2, 3, 1]);
    });

    test("should not allow me to see a confirm dialog when clicking the end-answer button", async ({
      mount,
      page,
    }) => {
      // Arrange
      const dialogMessages: string[] = [];
      page.on("dialog", async (dialog) => {
        dialogMessages.push(dialog.message());
        await dialog.accept();
      });
      const submittedBlockIds: number[][] = [];
      const component = await mount(
        <ReorderPuzzle
          sangakuId="1"
          blocks={blocks}
          title={title}
          description={description}
          onSubmit={(blockIds) => {
            submittedBlockIds.push(blockIds);
          }}
        />,
      );
      await moveBlocksToAnswerArea(component, ["puts 2"]);

      // Act
      await component.getByRole("button", { name: "解答を終了する" }).click();

      // Assert
      // onSubmit の呼び出しを待ってから（送信処理が完了した後で）ダイアログ未発火を確認する。
      await expect.poll(() => submittedBlockIds.length).toBe(1);
      expect(dialogMessages).toEqual([]);
    });

    test("should not allow me to call createAnswer when clicking the end-answer button", async ({
      mount,
      page,
    }) => {
      // Arrange
      page.on("dialog", (dialog) => dialog.accept());
      const submittedBlockIds: number[][] = [];
      const component = await mount(
        <ReorderPuzzle
          sangakuId="1"
          blocks={blocks}
          title={title}
          description={description}
          onSubmit={(blockIds) => {
            submittedBlockIds.push(blockIds);
          }}
        />,
      );
      await moveBlocksToAnswerArea(component, ["puts 2"]);

      // Act
      await component.getByRole("button", { name: "解答を終了する" }).click();

      // Assert
      await expect.poll(() => submittedBlockIds.length).toBe(1);
      const createAnswerCallCount = await page.evaluate(
        () => window.__createAnswerCalls?.length ?? 0,
      );
      expect(createAnswerCallCount).toBe(0);
    });
  });
});
