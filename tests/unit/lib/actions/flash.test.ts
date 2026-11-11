import { describe, test, expect } from "vitest";
import * as flashActions from "@/app/lib/actions/flash";

describe("actions/flash", () => {
  test("should expose only consumeFlash as a Server Action so that setFlash cannot be called from the client", () => {
    // Act
    const exportedNames = Object.keys(flashActions);

    // Assert
    expect(exportedNames).toEqual(["consumeFlash"]);
  });
});
