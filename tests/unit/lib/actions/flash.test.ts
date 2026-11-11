import { describe, test, expect } from "vitest";
import * as flashActions from "@/app/lib/actions/flash";

describe("actions/flash", () => {
  test("should export only consumeFlash so that no other function becomes a Server Action", () => {
    // Act
    const exportedNames = Object.keys(flashActions);

    // Assert
    expect(exportedNames).toEqual(["consumeFlash"]);
  });
});
