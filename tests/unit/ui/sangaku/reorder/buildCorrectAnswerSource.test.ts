import { describe, test, expect } from "vitest";
import { buildCorrectAnswerSource } from "@/app/ui/sangaku/reorder/buildCorrectAnswerSource";

// buildCorrectAnswerSource（正解のソースコードの組み立て）
describe("buildCorrectAnswerSource", () => {
  // ブロックが順不同のとき、correct_position の順にブロックの内容を連結する
  test("should join block contents ordered by correct_position when blocks are unordered", () => {
    const result = buildCorrectAnswerSource([
      { id: 2, content: "puts 2", correct_position: 2 },
      { id: 1, content: "puts 1", correct_position: 1 },
      { id: 3, content: "puts 3", correct_position: 3 },
    ]);

    expect(result).toBe("puts 1\nputs 2\nputs 3");
  });

  // correct_position が null のとき、ダミーブロックを除外する
  test("should exclude dummy blocks when correct_position is null", () => {
    const result = buildCorrectAnswerSource([
      { id: 1, content: "puts 1", correct_position: 1 },
      { id: 2, content: "dummy", correct_position: null },
      { id: 3, content: "puts 2", correct_position: 2 },
    ]);

    expect(result).toBe("puts 1\nputs 2");
  });

  // correct_position が undefined のとき、そのブロックを除外する
  test("should exclude blocks when correct_position is undefined", () => {
    const result = buildCorrectAnswerSource([
      { id: 1, content: "puts 1", correct_position: 1 },
      { id: 2, content: "unused" },
    ]);

    expect(result).toBe("puts 1");
  });

  // codeBlocks が空のとき、空文字列を返す
  test("should return an empty string when codeBlocks is empty", () => {
    const result = buildCorrectAnswerSource([]);

    expect(result).toBe("");
  });

  // すべてのブロックがダミーのとき、空文字列を返す
  test("should return an empty string when every block is a dummy block", () => {
    const result = buildCorrectAnswerSource([
      { id: 1, content: "dummy1", correct_position: null },
      { id: 2, content: "dummy2", correct_position: null },
    ]);

    expect(result).toBe("");
  });
});
