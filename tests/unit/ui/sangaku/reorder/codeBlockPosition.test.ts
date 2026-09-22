import { describe, test, expect } from "vitest";
import { assignCorrectPositions } from "@/app/ui/sangaku/reorder/codeBlockPosition";
import type { CodeBlockDraft } from "@/app/ui/sangaku/reorder/CodeBlockEditor";

function block(isDummy: boolean): CodeBlockDraft {
  return { content: "puts 1", isDummy };
}

describe("assignCorrectPositions", () => {
  test("should assign sequential positions starting from 1 when all blocks are correct blocks", () => {
    const blocks = [block(false), block(false), block(false)];

    const result = assignCorrectPositions(blocks);

    expect(result).toEqual([1, 2, 3]);
  });

  test("should assign null to every position when all blocks are dummy blocks", () => {
    const blocks = [block(true), block(true), block(true)];

    const result = assignCorrectPositions(blocks);

    expect(result).toEqual([null, null, null]);
  });

  test("should skip dummy blocks when counting sequential positions when correct and dummy blocks are mixed", () => {
    const blocks = [block(true), block(false), block(true), block(false)];

    const result = assignCorrectPositions(blocks);

    expect(result).toEqual([null, 1, null, 2]);
  });

  test("should return an empty array when blocks is empty", () => {
    const result = assignCorrectPositions([]);

    expect(result).toEqual([]);
  });

  test("should assign position 1 when the only block is a dummy followed by a correct block", () => {
    const blocks = [block(true), block(false)];

    const result = assignCorrectPositions(blocks);

    expect(result).toEqual([null, 1]);
  });
});
