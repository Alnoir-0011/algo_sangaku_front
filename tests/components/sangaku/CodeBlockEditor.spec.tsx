import { test, expect } from "@/tests/fixtures.ct";
import { CodeBlockEditorWrapper } from "./CodeBlockEditorStories";

// 分割前のコード入力欄は Monaco Editor（monaco-editor-block-input）。
// SangakuForm.tsx のソースコード欄と同じく、Monaco はこのプロジェクトの
// Playwright CT（Vite mount）環境では初期化が完了せず表示されない
// （SangakuForm.tsx 自身にも Monaco 部分の CT テストは存在しない）。
// そのため Monaco への実際の入力・分割挙動は E2E
// （tests/e2e/sangakus/create/page.spec.ts）で検証し、CT では
// Monaco に依存しない範囲（ブロックがある場合の編集操作等）のみを扱う。

test.describe("CodeBlockEditor", () => {
  test("should allow me to see split button when blocks is empty", async ({
    mount,
  }) => {
    // Arrange & Act
    const component = await mount(<CodeBlockEditorWrapper initial={[]} />);

    // Assert
    await expect(
      component.getByRole("button", { name: "行分割して生成" }),
    ).toBeVisible();
  });

  test("should not allow me to see block list when blocks is empty", async ({
    mount,
  }) => {
    // Arrange & Act
    const component = await mount(<CodeBlockEditorWrapper initial={[]} />);

    // Assert
    await expect(component.getByText("puts")).not.toBeVisible();
  });

  test("should allow me to see block contents when blocks has elements", async ({
    mount,
  }) => {
    // Arrange & Act
    const component = await mount(
      <CodeBlockEditorWrapper
        initial={[
          { content: "puts 1", isDummy: false },
          { content: "puts 2", isDummy: false },
        ]}
      />,
    );

    // Assert
    // ブロック内容は編集可能な入力欄（block-content-{index}）の値として描画される
    // （Cycle 3 でブロックが編集可能な TextField になったため、テキストノードとしては
    // 取得できない。getByText から getByLabel + toHaveValue に修正）
    await expect(component.getByLabel("block-content-0")).toHaveValue(
      "puts 1",
    );
    await expect(component.getByLabel("block-content-1")).toHaveValue(
      "puts 2",
    );
  });

  test("should not allow me to see text input and split button when blocks has elements", async ({
    mount,
  }) => {
    // Arrange & Act
    const component = await mount(
      <CodeBlockEditorWrapper
        initial={[
          { content: "puts 1", isDummy: false },
          { content: "puts 2", isDummy: false },
        ]}
      />,
    );

    // Assert
    // 生成用の Monaco Editor（monaco-editor-block-input）が非表示であることを確認する
    await expect(
      component.getByTestId("monaco-editor-block-input"),
    ).not.toBeVisible();
    await expect(
      component.getByRole("button", { name: "行分割して生成" }),
    ).not.toBeVisible();
  });

  // splitRawTextIntoBlocks（Monaco Editor への入力→「行分割して生成」で
  // ブロックが生成される挙動、空行除去を含む）は、上記の理由により
  // tests/e2e/sangakus/create/page.spec.ts の E2E テストで検証する。

  test("should allow me to edit a block content when blocks has elements", async ({
    mount,
  }) => {
    // Arrange
    const component = await mount(
      <CodeBlockEditorWrapper
        initial={[
          { content: "puts 1", isDummy: false },
          { content: "puts 2", isDummy: false },
        ]}
      />,
    );

    // Act
    await component.getByLabel("block-content-0").fill("puts 100");

    // Assert
    await expect(component.getByLabel("block-content-0")).toHaveValue(
      "puts 100",
    );
    await expect(component.getByLabel("block-content-1")).toHaveValue(
      "puts 2",
    );
  });

  test("should allow me to see delete buttons for each block when blocks has elements", async ({
    mount,
  }) => {
    // Arrange & Act
    const component = await mount(
      <CodeBlockEditorWrapper
        initial={[
          { content: "puts 1", isDummy: false },
          { content: "puts 2", isDummy: false },
          { content: "puts 3", isDummy: false },
        ]}
      />,
    );

    // Assert
    const deleteButtons = component.getByRole("button", { name: "削除" });
    await expect(deleteButtons).toHaveCount(3);
  });

  test("should allow me to remove a block by clicking its delete button when blocks has elements", async ({
    mount,
    page,
  }) => {
    // Arrange
    await mount(
      <CodeBlockEditorWrapper
        initial={[
          { content: "puts 1", isDummy: false },
          { content: "puts 2", isDummy: false },
          { content: "puts 3", isDummy: false },
        ]}
      />,
    );

    // Act
    await page.getByRole("button", { name: "削除" }).nth(1).click();

    // Assert
    // 削除後、残った2ブロックは詰め直されて block-content-0 / block-content-1 になる
    // （[value=...] 属性セレクタは <textarea> の値を拾えないため、ラベル基準で検証する）
    await expect(page.getByLabel("block-content-0")).toHaveValue("puts 1");
    await expect(page.getByLabel("block-content-1")).toHaveValue("puts 3");
    await expect(page.getByRole("textbox")).toHaveCount(2);
  });

  test("should allow me to see merge buttons for each block except the last one when blocks has elements", async ({
    mount,
  }) => {
    // Arrange & Act
    const component = await mount(
      <CodeBlockEditorWrapper
        initial={[
          { content: "puts 1", isDummy: false },
          { content: "puts 2", isDummy: false },
          { content: "puts 3", isDummy: false },
        ]}
      />,
    );

    // Assert
    const mergeButtons = component.getByRole("button", { name: "次と結合" });
    await expect(mergeButtons).toHaveCount(2);
  });

  test("should allow me to merge a block with the next block by clicking its merge button when blocks has elements", async ({
    mount,
    page,
  }) => {
    // Arrange
    await mount(
      <CodeBlockEditorWrapper
        initial={[
          { content: "puts 1", isDummy: false },
          { content: "puts 2", isDummy: false },
          { content: "puts 3", isDummy: false },
        ]}
      />,
    );

    // Act
    await page.getByRole("button", { name: "次と結合" }).nth(0).click();

    // Assert
    // 結合後、2ブロックに詰め直されて block-content-0（結合済み）/ block-content-1（puts 3）になる
    // （[value=...] 属性セレクタは <textarea> の値を拾えないため、ラベル基準で検証する）
    await expect(page.getByLabel("block-content-0")).toHaveValue(
      "puts 1\nputs 2",
    );
    await expect(page.getByLabel("block-content-1")).toHaveValue("puts 3");
    await expect(page.getByRole("textbox")).toHaveCount(2);
  });

  test("should allow me to see split buttons for each block when blocks has elements", async ({
    mount,
  }) => {
    // Arrange & Act
    const component = await mount(
      <CodeBlockEditorWrapper
        initial={[
          { content: "puts 1\nputs 2", isDummy: false },
          { content: "puts 3", isDummy: false },
        ]}
      />,
    );

    // Assert
    const splitButtons = component.getByRole("button", { name: "分割" });
    await expect(splitButtons).toHaveCount(2);
  });

  test("should allow me to split a block by its newlines into multiple blocks by clicking its split button when blocks has elements", async ({
    mount,
    page,
  }) => {
    // Arrange
    await mount(
      <CodeBlockEditorWrapper
        initial={[
          { content: "puts 1\nputs 2", isDummy: false },
          { content: "puts 3", isDummy: false },
        ]}
      />,
    );

    // Act
    await page.getByRole("button", { name: "分割" }).nth(0).click();

    // Assert
    // 分割後、2ブロックが3ブロックに増える。既存の「puts 3」ブロックのラベル番号は
    // block-content-1 から block-content-2 にずれる（[value=...] 属性セレクタは
    // <textarea> の値を拾えないため、ラベル基準で検証する）
    await expect(page.getByLabel("block-content-0")).toHaveValue("puts 1");
    await expect(page.getByLabel("block-content-1")).toHaveValue("puts 2");
    await expect(page.getByLabel("block-content-2")).toHaveValue("puts 3");
    await expect(page.getByRole("textbox")).toHaveCount(3);
  });

  test("should keep isDummy true when merging a dummy block with a correct block", async ({
    mount,
    page,
  }) => {
    // Arrange
    // isDummy: false 固定だと、ダミーブロックを結合しただけで出題者が
    // 気づかないまま正解ブロックへ格上げされてしまう不具合の回帰テスト。
    await mount(
      <CodeBlockEditorWrapper
        initial={[
          { content: "dummy", isDummy: true },
          { content: "puts 2", isDummy: false },
        ]}
      />,
    );

    // Act
    await page.getByRole("button", { name: "次と結合" }).nth(0).click();

    // Assert
    await expect(page.getByTestId("debug-is-dummy")).toHaveText("[true]");
  });

  test("should keep isDummy false when merging two correct blocks", async ({
    mount,
    page,
  }) => {
    // Arrange
    await mount(
      <CodeBlockEditorWrapper
        initial={[
          { content: "puts 1", isDummy: false },
          { content: "puts 2", isDummy: false },
        ]}
      />,
    );

    // Act
    await page.getByRole("button", { name: "次と結合" }).nth(0).click();

    // Assert
    await expect(page.getByTestId("debug-is-dummy")).toHaveText("[false]");
  });

  test("should keep isDummy true for every resulting block when splitting a dummy block", async ({
    mount,
    page,
  }) => {
    // Arrange
    // isDummy: false 固定だと、ダミーブロックを分割しただけで正解ブロックへ
    // 格上げされてしまう不具合の回帰テスト。
    await mount(
      <CodeBlockEditorWrapper
        initial={[{ content: "dummy 1\ndummy 2", isDummy: true }]}
      />,
    );

    // Act
    await page.getByRole("button", { name: "分割" }).click();

    // Assert
    await expect(page.getByTestId("debug-is-dummy")).toHaveText(
      "[true,true]",
    );
  });

  test("should allow me to see move-up and move-down buttons for each block when blocks has elements", async ({
    mount,
  }) => {
    // Arrange & Act
    const component = await mount(
      <CodeBlockEditorWrapper
        initial={[
          { content: "puts 1", isDummy: false },
          { content: "puts 2", isDummy: false },
        ]}
      />,
    );

    // Assert
    await expect(component.getByRole("button", { name: "上へ" })).toHaveCount(
      2,
    );
    await expect(
      component.getByRole("button", { name: "下へ" }),
    ).toHaveCount(2);
  });

  test("should not allow me to click the move-up button when the block is at the top of the list", async ({
    mount,
  }) => {
    // Arrange & Act
    const component = await mount(
      <CodeBlockEditorWrapper
        initial={[
          { content: "puts 1", isDummy: false },
          { content: "puts 2", isDummy: false },
        ]}
      />,
    );

    // Assert
    await expect(
      component.getByRole("button", { name: "上へ" }).nth(0),
    ).toBeDisabled();
  });

  test("should not allow me to click the move-down button when the block is at the bottom of the list", async ({
    mount,
  }) => {
    // Arrange & Act
    const component = await mount(
      <CodeBlockEditorWrapper
        initial={[
          { content: "puts 1", isDummy: false },
          { content: "puts 2", isDummy: false },
        ]}
      />,
    );

    // Assert
    await expect(
      component.getByRole("button", { name: "下へ" }).nth(1),
    ).toBeDisabled();
  });

  test("should allow me to move a block up by clicking its move-up button when the block is not at the top", async ({
    mount,
    page,
  }) => {
    // Arrange
    await mount(
      <CodeBlockEditorWrapper
        initial={[
          { content: "puts 1", isDummy: false },
          { content: "puts 2", isDummy: false },
          { content: "puts 3", isDummy: false },
        ]}
      />,
    );

    // Act
    await page.getByRole("button", { name: "上へ" }).nth(1).click();

    // Assert
    await expect(page.getByLabel("block-content-0")).toHaveValue("puts 2");
    await expect(page.getByLabel("block-content-1")).toHaveValue("puts 1");
    await expect(page.getByLabel("block-content-2")).toHaveValue("puts 3");
  });

  test("should allow me to move a block down by clicking its move-down button when the block is not at the bottom", async ({
    mount,
    page,
  }) => {
    // Arrange
    await mount(
      <CodeBlockEditorWrapper
        initial={[
          { content: "puts 1", isDummy: false },
          { content: "puts 2", isDummy: false },
          { content: "puts 3", isDummy: false },
        ]}
      />,
    );

    // Act
    await page.getByRole("button", { name: "下へ" }).nth(0).click();

    // Assert
    await expect(page.getByLabel("block-content-0")).toHaveValue("puts 2");
    await expect(page.getByLabel("block-content-1")).toHaveValue("puts 1");
    await expect(page.getByLabel("block-content-2")).toHaveValue("puts 3");
  });

  test("should allow me to add an empty dummy block to the end of the list when I click add dummy block button", async ({
    mount,
    page,
  }) => {
    // Arrange
    await mount(
      <CodeBlockEditorWrapper
        initial={[
          { content: "puts 1", isDummy: false },
          { content: "puts 2", isDummy: false },
        ]}
      />,
    );

    // Act
    await page
      .getByRole("button", { name: "ダミーブロックを追加" })
      .click();

    // Assert
    await expect(page.getByLabel("block-content-0")).toHaveValue("puts 1");
    await expect(page.getByLabel("block-content-1")).toHaveValue("puts 2");
    await expect(page.getByLabel("block-content-2")).toHaveValue("");
    await expect(page.getByRole("textbox")).toHaveCount(3);
  });
});
