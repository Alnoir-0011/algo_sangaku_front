import { describe, test, expect } from "vitest";
import { buildCorrectAnswerSource } from "@/app/ui/sangaku/reorder/buildCorrectAnswerSource";

describe("buildCorrectAnswerSource", () => {
  test("should join block contents ordered by correct_position when blocks are unordered", () => {
    const result = buildCorrectAnswerSource([
      { id: 2, content: "puts 2", correct_position: 2 },
      { id: 1, content: "puts 1", correct_position: 1 },
      { id: 3, content: "puts 3", correct_position: 3 },
    ]);

    expect(result).toBe("puts 1\nputs 2\nputs 3");
  });

  test("should exclude dummy blocks when correct_position is null", () => {
    const result = buildCorrectAnswerSource([
      { id: 1, content: "puts 1", correct_position: 1 },
      { id: 2, content: "dummy", correct_position: null },
      { id: 3, content: "puts 2", correct_position: 2 },
    ]);

    expect(result).toBe("puts 1\nputs 2");
  });

  test("should exclude blocks when correct_position is undefined", () => {
    const result = buildCorrectAnswerSource([
      { id: 1, content: "puts 1", correct_position: 1 },
      { id: 2, content: "unused" },
    ]);

    expect(result).toBe("puts 1");
  });

  test("should return an empty string when codeBlocks is empty", () => {
    const result = buildCorrectAnswerSource([]);

    expect(result).toBe("");
  });

  test("should return an empty string when every block is a dummy block", () => {
    const result = buildCorrectAnswerSource([
      { id: 1, content: "dummy1", correct_position: null },
      { id: 2, content: "dummy2", correct_position: null },
    ]);

    expect(result).toBe("");
  });
});
