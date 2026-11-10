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

describe("toPuzzleBlocks", () => {
  test("should drop correct_position from every block", () => {
    const result = toPuzzleBlocks(codeBlocks);

    for (const block of result) {
      expect(Object.keys(block).sort()).toEqual(["content", "id"]);
    }
  });

  test("should keep every block exactly once when shuffling", () => {
    const result = toPuzzleBlocks(codeBlocks);

    expect(result).toHaveLength(codeBlocks.length);
    expect(result.map((block) => block.id).sort()).toEqual([1, 2, 3, 4]);
    expect(result.find((block) => block.id === 3)?.content).toBe("c");
  });

  test("should not return the blocks in the given order when the input is in the correct order", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    const result = toPuzzleBlocks(codeBlocks);

    expect(result.map((block) => block.id)).not.toEqual([1, 2, 3, 4]);
  });

  test("should not return the blocks in the given order even when the random numbers would keep the order", () => {
    // 各ステップで j === i になり、Fisher-Yates が恒等順列を返す乱数
    vi.spyOn(Math, "random").mockReturnValue(0.999);

    const result = toPuzzleBlocks(codeBlocks);

    expect(result.map((block) => block.id)).not.toEqual([1, 2, 3, 4]);
    expect(result.map((block) => block.id).sort()).toEqual([1, 2, 3, 4]);
  });

  test("should not mutate the given array", () => {
    const original = codeBlocks.map((block) => block.id);

    toPuzzleBlocks(codeBlocks);

    expect(codeBlocks.map((block) => block.id)).toEqual(original);
  });

  test("should return an empty array when there are no blocks", () => {
    expect(toPuzzleBlocks([])).toEqual([]);
  });
});
