import { test, expect } from "@/tests/fixtures.ct";
import ReorderSangakuForm from "@/app/ui/sangaku/reorder/ReorderSangakuForm";

const initialState = {
  values: { title: "test_title", description: "test_description" },
};

test.describe("ReorderSangakuForm", () => {
  test("should allow me to see pre-filled title when initial state has a title", async ({
    mount,
  }) => {
    const component = await mount(
      <ReorderSangakuForm
        action={async () => ({})}
        initialState={initialState}
        initialDescription="test_description"
        initialDifficulty="normal"
        initialBlocks={[]}
      />,
    );

    await expect(component.getByLabel("タイトル")).toHaveValue("test_title");
  });

  test("should allow me to see pre-filled description when initial description is given", async ({
    mount,
  }) => {
    const component = await mount(
      <ReorderSangakuForm
        action={async () => ({})}
        initialState={initialState}
        initialDescription="test_description"
        initialDifficulty="normal"
        initialBlocks={[]}
      />,
    );

    await expect(component.getByLabel("問題文")).toHaveValue(
      "test_description",
    );
  });

  test("should allow me to see selected difficulty label when initial difficulty is given", async ({
    mount,
  }) => {
    const component = await mount(
      <ReorderSangakuForm
        action={async () => ({})}
        initialState={initialState}
        initialDescription="test_description"
        initialDifficulty="normal"
        initialBlocks={[]}
      />,
    );

    // SangakuForm.tsx と同じ非native MUI Select（隠しinput方式）のため、
    // toHaveValue ではなく選択中の表示テキストで検証する
    await expect(component.getByRole("combobox")).toHaveText("普通");
  });

  test("should allow me to change difficulty select value when a different option is selected", async ({
    mount,
    page,
  }) => {
    const component = await mount(
      <ReorderSangakuForm
        action={async () => ({})}
        initialState={initialState}
        initialDescription="test_description"
        initialDifficulty="normal"
        initialBlocks={[]}
      />,
    );

    await component.getByRole("combobox").click();
    // "難しい" は "とても難しい" にも部分一致するため exact: true で区別する
    await page.getByRole("option", { name: "難しい", exact: true }).click();

    await expect(component.getByRole("combobox")).toHaveText("難しい");
  });

  test("should allow me to see initial code blocks when initialBlocks is given", async ({
    mount,
  }) => {
    const component = await mount(
      <ReorderSangakuForm
        action={async () => ({})}
        initialState={initialState}
        initialDescription="test_description"
        initialDifficulty="normal"
        initialBlocks={[
          { content: "puts 1", isDummy: false },
          { content: "puts 2", isDummy: false },
        ]}
      />,
    );

    await expect(component.getByLabel("block-content-0")).toHaveValue(
      "puts 1",
    );
    await expect(component.getByLabel("block-content-1")).toHaveValue(
      "puts 2",
    );
  });

  test("should allow me to see field errors when state has errors for title, description, and difficulty", async ({
    mount,
  }) => {
    const errorState = {
      errors: {
        title: ["を入力してください"],
        description: ["を入力してください"],
        difficulty: ["を入力してください"],
      },
    };

    const component = await mount(
      <ReorderSangakuForm
        action={async () => ({})}
        initialState={errorState}
        initialDescription="test_description"
        initialDifficulty="normal"
        initialBlocks={[]}
      />,
    );

    await expect(component.getByLabel("titleError")).toHaveText(
      "を入力してください",
    );
    await expect(component.getByLabel("descriptionError")).toHaveText(
      "を入力してください",
    );
    await expect(component.getByLabel("difficultyError")).toHaveText(
      "を入力してください",
    );
  });

  test("should allow me to keep the latest description value when the field is filled more than once", async ({
    mount,
  }) => {
    // Arrange
    const component = await mount(
      <ReorderSangakuForm
        action={async () => ({})}
        initialState={initialState}
        initialDescription="test_description"
        initialDifficulty="normal"
        initialBlocks={[]}
      />,
    );
    const descriptionField = component.getByLabel("問題文");

    // Act: 1回目の入力
    await descriptionField.fill("new description");

    // Assert: 1回目の入力値が反映されている
    await expect(descriptionField).toHaveValue("new description");

    // Act: 2回目の入力（値を上書き）
    await descriptionField.fill("another description");

    // Assert: state 経由で最新の入力値のみが保持されている
    await expect(descriptionField).toHaveValue("another description");
  });

  test("should allow me to see a confirm button when the form is rendered", async ({
    mount,
  }) => {
    // Arrange
    const component = await mount(
      <ReorderSangakuForm
        action={async () => ({})}
        initialState={initialState}
        initialDescription="test_description"
        initialDifficulty="normal"
        initialBlocks={[]}
      />,
    );

    // Assert
    // RED: 直接送信の「保存する」ボタンのみが表示されており、「確認画面へ」ボタンが
    // まだ実装されていないため失敗する
    await expect(
      component.getByRole("button", { name: "確認画面へ" }),
    ).toBeVisible();
  });

  test("should not allow me to see the min code blocks warning when no blocks have been generated yet", async ({
    mount,
  }) => {
    const component = await mount(
      <ReorderSangakuForm
        action={async () => ({})}
        initialState={initialState}
        initialDescription="test_description"
        initialDifficulty="normal"
        initialBlocks={[]}
      />,
    );

    await expect(
      component.getByLabel("minCodeBlocksWarning"),
    ).not.toBeVisible();
  });

  test("should not allow me to proceed to confirmation when there are fewer than two correct blocks", async ({
    mount,
  }) => {
    // Arrange
    const component = await mount(
      <ReorderSangakuForm
        action={async () => ({})}
        initialState={initialState}
        initialDescription="test_description"
        initialDifficulty="normal"
        initialBlocks={[{ content: "puts 1", isDummy: false }]}
      />,
    );

    // Assert
    // RED: 「確認画面へ」ボタンがまだ存在しないため name 指定のロケーターが
    // 要素を見つけられず失敗する
    await expect(
      component.getByRole("button", { name: "確認画面へ" }),
    ).toBeDisabled();
    await expect(component.getByLabel("minCodeBlocksWarning")).toBeVisible();
  });

  test("should allow me to proceed to confirmation when there are two or more correct blocks", async ({
    mount,
  }) => {
    // Arrange
    const component = await mount(
      <ReorderSangakuForm
        action={async () => ({})}
        initialState={initialState}
        initialDescription="test_description"
        initialDifficulty="normal"
        initialBlocks={[
          { content: "puts 1", isDummy: false },
          { content: "puts 2", isDummy: false },
        ]}
      />,
    );

    // Assert
    // RED: 「確認画面へ」ボタンがまだ存在しないため name 指定のロケーターが
    // 要素を見つけられず失敗する
    await expect(
      component.getByRole("button", { name: "確認画面へ" }),
    ).toBeEnabled();
    await expect(
      component.getByLabel("minCodeBlocksWarning"),
    ).not.toBeVisible();
  });

  test("should allow me to open the confirmation modal when I click the confirm button", async ({
    mount,
    page,
  }) => {
    // Arrange
    const component = await mount(
      <ReorderSangakuForm
        action={async () => ({})}
        initialState={initialState}
        initialDescription="test_description"
        initialDifficulty="normal"
        initialBlocks={[
          { content: "puts 1", isDummy: false },
          { content: "puts 2", isDummy: false },
        ]}
      />,
    );

    // Act
    await component.getByRole("button", { name: "確認画面へ" }).click();

    // Assert
    // RED: 「確認画面へ」ボタンおよび ReorderCheckPage との統合（モーダルを開く
    // state）がまだ実装されていないため、ボタンのクリック自体が失敗するか、
    // モーダルの data-testid が描画されず失敗する。
    // MUI Modal は Portal で document.body 直下に描画されるため
    // component.getByTestId ではなく page.getByTestId を使う
    await expect(
      page.getByTestId("reorder-check-page-modal"),
    ).toBeVisible();
  });

  test("should allow me to see a code_blocks error when state has a code_blocks error", async ({
    mount,
  }) => {
    const component = await mount(
      <ReorderSangakuForm
        action={async () => ({})}
        initialState={{
          errors: { code_blocks: ["は正解ブロックを2個以上指定してください"] },
        }}
        initialDescription="test_description"
        initialDifficulty="normal"
        initialBlocks={[
          { content: "puts 1", isDummy: false },
          { content: "puts 2", isDummy: false },
        ]}
      />,
    );

    await expect(component.getByLabel("codeBlocksError")).toHaveText(
      "は正解ブロックを2個以上指定してください",
    );
  });

  test("should allow me to submit the form when I click the save button inside the confirmation modal", async ({
    mount,
    page,
  }) => {
    // Arrange
    let actionCalled = false;
    const component = await mount(
      <ReorderSangakuForm
        action={async () => {
          actionCalled = true;
          return {};
        }}
        initialState={initialState}
        initialDescription="test_description"
        initialDifficulty="normal"
        initialBlocks={[
          { content: "puts 1", isDummy: false },
          { content: "puts 2", isDummy: false },
        ]}
      />,
    );

    // Act
    await component.getByRole("button", { name: "確認画面へ" }).click();
    // MUI Modal は Portal で document.body 直下に描画されるため
    // component.getByRole ではなく page.getByRole を使う
    await page.getByRole("button", { name: "保存する" }).click();

    // Assert
    // RED: モーダル内の「保存する」ボタンとモーダル外の<form>との結合が
    // 正しく機能していない場合、action が呼び出されず actionCalled が
    // false のままとなり失敗する
    await expect.poll(() => actionCalled).toBe(true);
  });
});
