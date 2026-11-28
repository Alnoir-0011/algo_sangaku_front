import { describe, test, expect } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { useKeepScreenOnFailure } from "@/app/ui/flash/SubmitFailureNotice";

function ComponentUsingTheHook() {
  useKeepScreenOnFailure();
  return null;
}

// useKeepScreenOnFailure（失敗時に画面を維持するフック）
describe("useKeepScreenOnFailure", () => {
  // SubmitFailureNoticeProvider の外で使うと、プロバイダーの欠落が黙って無視されないよう例外を投げる
  test("should throw when it is used outside SubmitFailureNoticeProvider so that a missing provider is never silently ignored", () => {
    // Act & Assert
    expect(() => renderToString(createElement(ComponentUsingTheHook))).toThrow(
      "SubmitFailureNoticeProvider",
    );
  });
});
