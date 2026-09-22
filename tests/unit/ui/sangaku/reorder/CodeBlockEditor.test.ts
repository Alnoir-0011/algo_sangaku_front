import { describe, test, expect } from "vitest";
import { splitRawTextIntoBlocks } from "@/app/ui/sangaku/reorder/CodeBlockEditor";

// Monaco Editor（monaco-editor-block-input）は Playwright CT 環境では
// 初期化が完了せず表示されないため、この分割ロジックはコンポーネントテストではなく
// 純粋関数として直接ユニットテストする（詳細は CodeBlockEditor.spec.tsx 冒頭コメント参照）。
describe("splitRawTextIntoBlocks", () => {
  test("should split text into blocks by newline when called with multiline text", () => {
    const result = splitRawTextIntoBlocks("puts 1\nputs 2\nputs 3");

    expect(result).toEqual([
      { content: "puts 1", isDummy: false },
      { content: "puts 2", isDummy: false },
      { content: "puts 3", isDummy: false },
    ]);
  });

  test("should remove empty lines when the text contains blank lines", () => {
    const result = splitRawTextIntoBlocks("puts 1\n\nputs 2");

    expect(result).toEqual([
      { content: "puts 1", isDummy: false },
      { content: "puts 2", isDummy: false },
    ]);
  });

  test("should remove whitespace-only lines when the text contains lines with only spaces", () => {
    const result = splitRawTextIntoBlocks("puts 1\n   \nputs 2");

    expect(result).toEqual([
      { content: "puts 1", isDummy: false },
      { content: "puts 2", isDummy: false },
    ]);
  });

  test("should return an empty array when the text is empty", () => {
    const result = splitRawTextIntoBlocks("");

    expect(result).toEqual([]);
  });

  // Monaco Editor の自動インデントにより、改行直前の行末に意図しない空白が
  // 付与されることがある（E2E で実際に観測された）。末尾の空白は除去し、
  // 先頭のインデントはコードの見た目として意味を持ちうるため保持する。
  test("should trim trailing whitespace from each line when a line has trailing spaces", () => {
    const result = splitRawTextIntoBlocks("puts 1    \nputs 2");

    expect(result).toEqual([
      { content: "puts 1", isDummy: false },
      { content: "puts 2", isDummy: false },
    ]);
  });

  test("should keep leading whitespace when a line has leading spaces", () => {
    const result = splitRawTextIntoBlocks("puts 1\n  puts 2");

    expect(result).toEqual([
      { content: "puts 1", isDummy: false },
      { content: "  puts 2", isDummy: false },
    ]);
  });
});
