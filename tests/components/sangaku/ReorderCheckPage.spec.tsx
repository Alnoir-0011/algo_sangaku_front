import { test, expect } from "@/tests/fixtures.ct";
import ReorderCheckPage from "@/app/ui/sangaku/reorder/ReorderCheckPage";
import type { CodeBlockDraft } from "@/app/ui/sangaku/reorder/CodeBlockEditor";

// ReorderCheckPage の各ブロックは、配列上の並び順（index）をそのまま
// data-testid="reorder-check-page-block-{index}" として持つことを前提にする
// （blocks を配列の並び順のまま表示するという仕様、および CodeBlockEditor の
// block-content-{index} と同様の識別子パターンに倣った設計判断）。
// この testid は仕様に明記されていないため、GREEN フェーズ実装時にこのパターンで
// 実装することが前提となる。

test.describe("ReorderCheckPage", () => {
  test("should allow me to see the modal when open is true", async ({
    mount,
    page,
  }) => {
    // Arrange
    const blocks: CodeBlockDraft[] = [{ content: "puts 1", isDummy: false }];

    // Act
    await mount(
      <ReorderCheckPage open={true} onClose={() => {}} blocks={blocks} formId="reorder_sangaku_form" />,
    );

    // Assert
    // RED: ReorderCheckPage が未実装のため import に失敗し、テストが実行できず失敗する
    // MUI Modal は React Portal で document.body 直下にレンダリングされるため、
    // マウント済みコンポーネントのルート配下に限定される component.getByTestId
    // ではなく、ページ全体を対象にする page.getByTestId を使う
    await expect(
      page.getByTestId("reorder-check-page-modal"),
    ).toBeVisible();
  });

  test("should not allow me to see the modal when open is false", async ({
    mount,
    page,
  }) => {
    // Arrange
    const blocks: CodeBlockDraft[] = [{ content: "puts 1", isDummy: false }];

    // Act
    await mount(
      <ReorderCheckPage open={false} onClose={() => {}} blocks={blocks} formId="reorder_sangaku_form" />,
    );

    // Assert
    // RED: ReorderCheckPage が未実装のため import に失敗し、テストが実行できず失敗する
    await expect(
      page.getByTestId("reorder-check-page-modal"),
    ).not.toBeVisible();
  });

  test("should allow me to see correct blocks numbered in correct_position order when blocks contain only non-dummy blocks", async ({
    mount,
    page,
  }) => {
    // Arrange
    const blocks: CodeBlockDraft[] = [
      { content: "puts 1", isDummy: false },
      { content: "puts 2", isDummy: false },
      { content: "puts 3", isDummy: false },
    ];

    // Act
    await mount(
      <ReorderCheckPage open={true} onClose={() => {}} blocks={blocks} formId="reorder_sangaku_form" />,
    );

    // Assert
    // RED: ReorderCheckPage が未実装のため import に失敗し、テストが実行できず失敗する
    // MUI Modal は Portal 描画のため page.getByTestId を使う（上記コメント参照）
    const block0 = page.getByTestId("reorder-check-page-block-0");
    await expect(block0.getByText("1", { exact: true })).toBeVisible();
    await expect(block0.getByText("puts 1")).toBeVisible();

    const block1 = page.getByTestId("reorder-check-page-block-1");
    await expect(block1.getByText("2", { exact: true })).toBeVisible();
    await expect(block1.getByText("puts 2")).toBeVisible();

    const block2 = page.getByTestId("reorder-check-page-block-2");
    await expect(block2.getByText("3", { exact: true })).toBeVisible();
    await expect(block2.getByText("puts 3")).toBeVisible();
  });

  test("should allow me to see a dummy label instead of a number when a block is marked as dummy", async ({
    mount,
    page,
  }) => {
    // Arrange
    const blocks: CodeBlockDraft[] = [{ content: "dummy content", isDummy: true }];

    // Act
    await mount(
      <ReorderCheckPage open={true} onClose={() => {}} blocks={blocks} formId="reorder_sangaku_form" />,
    );

    // Assert
    // RED: ReorderCheckPage が未実装のため import に失敗し、テストが実行できず失敗する
    // MUI Modal は Portal 描画のため page.getByTestId を使う（上記コメント参照）
    const dummyBlock = page.getByTestId("reorder-check-page-block-0");
    await expect(
      dummyBlock.getByText("ダミー", { exact: true }),
    ).toBeVisible();
    await expect(dummyBlock.getByText("dummy content")).toBeVisible();
    await expect(dummyBlock.getByText("1", { exact: true })).not.toBeVisible();
  });

  test("should allow me to see correct block numbering skip dummy blocks when correct and dummy blocks are mixed", async ({
    mount,
    page,
  }) => {
    // Arrange
    const blocks: CodeBlockDraft[] = [
      { content: "puts 1", isDummy: false },
      { content: "dummy content", isDummy: true },
      { content: "puts 2", isDummy: false },
    ];

    // Act
    await mount(
      <ReorderCheckPage open={true} onClose={() => {}} blocks={blocks} formId="reorder_sangaku_form" />,
    );

    // Assert
    // RED: ReorderCheckPage が未実装のため import に失敗し、テストが実行できず失敗する
    // MUI Modal は Portal 描画のため page.getByTestId を使う（上記コメント参照）
    // ダミーブロックは配列上2番目（index 1）だが、正解ブロックの連番は非ダミーのみを
    // カウントするため、直後の正解ブロック（index 2）は "3" ではなく "2" になる
    const secondCorrectBlock = page.getByTestId(
      "reorder-check-page-block-2",
    );
    await expect(
      secondCorrectBlock.getByText("2", { exact: true }),
    ).toBeVisible();
  });

  test("should allow me to go back to the create page when I click the back button", async ({
    mount,
    page,
  }) => {
    // Arrange
    const blocks: CodeBlockDraft[] = [{ content: "puts 1", isDummy: false }];
    let onCloseCalled = false;

    // Act
    await mount(
      <ReorderCheckPage
        open={true}
        onClose={() => {
          onCloseCalled = true;
        }}
        blocks={blocks}
        formId="reorder_sangaku_form"
      />,
    );
    // MUI Modal は Portal 描画のため page.getByRole を使う（上記コメント参照）
    await page.getByRole("button", { name: "作成画面に戻る" }).click();

    // Assert
    // RED: formId プロパティが Props に存在せず、onClose 呼び出し検証以前に型エラーで失敗する
    expect(onCloseCalled).toBe(true);
  });

  test("should allow me to see the save button associated with the given form id", async ({
    mount,
    page,
  }) => {
    // Arrange
    const blocks: CodeBlockDraft[] = [{ content: "puts 1", isDummy: false }];

    // Act
    await mount(
      <ReorderCheckPage
        open={true}
        onClose={() => {}}
        blocks={blocks}
        formId="reorder_sangaku_form"
      />,
    );

    // Assert
    // RED: formId プロパティが Props に存在しないため、保存ボタンに form 属性が
    // 設定されず失敗する
    const saveButton = page.getByRole("button", { name: "保存する" });
    await expect(saveButton).toHaveAttribute("form", "reorder_sangaku_form");
  });
});
