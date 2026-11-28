import { afterEach, describe, expect, test, vi } from "vitest";
import { toPuzzleBlocks } from "@/app/ui/sangaku/reorder/toPuzzleBlocks";
import type { CodeBlock } from "@/app/lib/definitions";

const codeBlocks: CodeBlock[] = [
  { id: 1, content: "a", correct_position: 1 },
  { id: 2, content: "b", correct_position: 2 },
  { id: 3, content: "c", correct_position: 3 },
  { id: 4, content: "d", correct_position: null },
];

afterEach(() => {
  vi.restoreAllMocks();
});

// toPuzzleBlocks（パズル用ブロックへの変換）
describe("toPuzzleBlocks", () => {
  // すべてのブロックから correct_position を取り除く
  test("should drop correct_position from every block", () => {
    const result = toPuzzleBlocks(codeBlocks);

    for (const block of result) {
      expect(Object.keys(block).sort()).toEqual(["content", "id"]);
    }
  });

  // シャッフルしても、すべてのブロックをちょうど 1 回ずつ保つ
  test("should keep every block exactly once when shuffling", () => {
    const result = toPuzzleBlocks(codeBlocks);

    expect(result).toHaveLength(codeBlocks.length);
    expect(result.map((block) => block.id).sort()).toEqual([1, 2, 3, 4]);
    expect(result.find((block) => block.id === 3)?.content).toBe("c");
  });

  // 入力が正しい順序のとき、渡された順序のままブロックを返さない
  test("should not return the blocks in the given order when the input is in the correct order", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    const result = toPuzzleBlocks(codeBlocks);

    expect(result.map((block) => block.id)).not.toEqual([1, 2, 3, 4]);
  });

  // 乱数が順序を保つ値になるときでも、渡された順序のままブロックを返さない
  test("should not return the blocks in the given order even when the random numbers would keep the order", () => {
    // 各ステップで j === i になり、Fisher-Yates が恒等順列を返す乱数
    vi.spyOn(Math, "random").mockReturnValue(0.999);

    const result = toPuzzleBlocks(codeBlocks);

    expect(result.map((block) => block.id)).not.toEqual([1, 2, 3, 4]);
    expect(result.map((block) => block.id).sort()).toEqual([1, 2, 3, 4]);
  });

  // 渡された配列を変更しない
  test("should not mutate the given array", () => {
    const original = codeBlocks.map((block) => block.id);

    toPuzzleBlocks(codeBlocks);

    expect(codeBlocks.map((block) => block.id)).toEqual(original);
  });

  // ブロックがないとき、空配列を返す
  test("should return an empty array when there are no blocks", () => {
    expect(toPuzzleBlocks([])).toEqual([]);
  });
});
