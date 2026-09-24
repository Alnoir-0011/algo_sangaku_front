import { test, expect } from "@/tests/fixtures.ct";
import { ControlledMarkdownEditor } from "./MarkdownEditorStories";

test.describe("MarkdownEditor", () => {
  test("should allow me to insert an indent at the beginning of the text when pressing Tab", async ({
    mount,
  }) => {
    // Arrange
    const component = await mount(
      <ControlledMarkdownEditor initial={"puts 1\nputs 2"} />,
    );
    const textbox = component.getByRole("textbox");
    await textbox.click();
    // click() のデフォルト位置（要素中央）や OS 依存のキーボードショートカット
    // （Home/Control+Home）はテキスト量・実行環境によって挙動が変わり不安定
    // なため、DOM の selectionStart/selectionEnd を直接指定してカーソル位置
    // （1行目の先頭）を固定する
    await textbox.evaluate((el: HTMLTextAreaElement) => {
      el.setSelectionRange(0, 0);
    });

    // Act
    await textbox.press("Tab");

    // Assert
    await expect(textbox).toHaveValue("  puts 1\nputs 2");
  });

  test("should allow me to insert an indent in the middle of the text when pressing Tab", async ({
    mount,
  }) => {
    // Arrange
    const component = await mount(
      <ControlledMarkdownEditor initial={"puts 1\nputs 2"} />,
    );
    const textbox = component.getByRole("textbox");
    await textbox.click();
    // 2行目 "puts 2" の先頭（インデックス7）にカーソルを固定する。
    // 行頭以外の位置でもインデントがカーソル位置に挿入されることを確認する。
    await textbox.evaluate((el: HTMLTextAreaElement) => {
      el.setSelectionRange(7, 7);
    });

    // Act
    await textbox.press("Tab");

    // Assert
    await expect(textbox).toHaveValue("puts 1\n  puts 2");
  });

  test("should not allow me to insert an indent when pressing Shift+Tab", async ({
    mount,
  }) => {
    // Arrange
    const component = await mount(
      <ControlledMarkdownEditor initial={"puts 1\nputs 2"} />,
    );
    const textbox = component.getByRole("textbox");
    await textbox.click();
    await textbox.evaluate((el: HTMLTextAreaElement) => {
      el.setSelectionRange(0, 0);
    });

    // Act
    await textbox.press("Shift+Tab");

    // Assert
    await expect(textbox).toHaveValue("puts 1\nputs 2");
  });

  test("should not allow me to move focus away from the editor when pressing Tab", async ({
    mount,
  }) => {
    // Arrange
    const component = await mount(
      <ControlledMarkdownEditor initial={"puts 1\nputs 2"} />,
    );
    const textbox = component.getByRole("textbox");
    await textbox.click();

    // Act
    await textbox.press("Tab");

    // Assert
    await expect(textbox).toBeFocused();
  });
});
