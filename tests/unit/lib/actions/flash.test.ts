import { describe, test, expect } from "vitest";
import * as flashActions from "@/app/lib/actions/flash";

// actions/flash（フラッシュメッセージの Server Action）
describe("actions/flash", () => {
  // consumeFlash だけをエクスポートし、他の関数が Server Action にならない
  test("should export only consumeFlash so that no other function becomes a Server Action", () => {
    // Act
    const exportedNames = Object.keys(flashActions);

    // Assert
    expect(exportedNames).toEqual(["consumeFlash"]);
  });
});
