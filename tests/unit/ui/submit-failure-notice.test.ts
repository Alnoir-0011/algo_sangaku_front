import { describe, test, expect } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { useKeepScreenOnFailure } from "@/app/ui/flash/SubmitFailureNotice";

function ComponentUsingTheHook() {
  useKeepScreenOnFailure();
  return null;
}

describe("useKeepScreenOnFailure", () => {
  test("should throw when it is used outside SubmitFailureNoticeProvider so that a missing provider is never silently ignored", () => {
    // Act & Assert
    expect(() => renderToString(createElement(ComponentUsingTheHook))).toThrow(
      "SubmitFailureNoticeProvider",
    );
  });
});
