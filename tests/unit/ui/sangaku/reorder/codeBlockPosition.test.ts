import { describe, test, expect } from "vitest";
import { assignCorrectPositions } from "@/app/ui/sangaku/reorder/codeBlockPosition";
import type { CodeBlockDraft } from "@/app/ui/sangaku/reorder/CodeBlockEditor";

function block(isDummy: boolean): CodeBlockDraft {
  return { content: "puts 1", isDummy };
}

// assignCorrectPositions（正解位置の割り当て）
describe("assignCorrectPositions", () => {
  // すべてのブロックが正解ブロックのとき、1 から始まる連番を割り当てる
  test("should assign sequential positions starting from 1 when all blocks are correct blocks", () => {
    const blocks = [block(false), block(false), block(false)];

    const result = assignCorrectPositions(blocks);

    expect(result).toEqual([1, 2, 3]);
  });

  // すべてのブロックがダミーのとき、すべての位置に null を割り当てる
  test("should assign null to every position when all blocks are dummy blocks", () => {
    const blocks = [block(true), block(true), block(true)];

    const result = assignCorrectPositions(blocks);

    expect(result).toEqual([null, null, null]);
  });

  // 正解ブロックとダミーブロックが混在するとき、連番を数える際にダミーブロックを飛ばす
  test("should skip dummy blocks when counting sequential positions when correct and dummy blocks are mixed", () => {
    const blocks = [block(true), block(false), block(true), block(false)];

    const result = assignCorrectPositions(blocks);

    expect(result).toEqual([null, 1, null, 2]);
  });

  // blocks が空のとき、空配列を返す
  test("should return an empty array when blocks is empty", () => {
    const result = assignCorrectPositions([]);

    expect(result).toEqual([]);
  });

  // 唯一のダミーブロックの後に正解ブロックが続くとき、位置 1 を割り当てる
  test("should assign position 1 when the only block is a dummy followed by a correct block", () => {
    const blocks = [block(true), block(false)];

    const result = assignCorrectPositions(blocks);

    expect(result).toEqual([null, 1]);
  });
});
