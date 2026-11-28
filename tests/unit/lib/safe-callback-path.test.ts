import { describe, test, expect } from "vitest";

import { safeCallbackPath } from "@/app/lib/safe-callback-path";

describe("safeCallbackPath", () => {
  test.each(["/user/profile", "/shrines?searchType=Map", "/a/b#section"])(
    "should allow me to go back to a page of this site (%s)",
    (path) => {
      expect(safeCallbackPath(path)).toBe(path);
    },
  );

  test.each([
    ["a protocol-relative URL", "//evil.example"],
    ["a backslash host", "/\\evil.example"],
    ["a tab that the browser removes", "/\t/evil.example"],
    ["a newline", "/a\nb"],
    ["an absolute URL", "https://evil.example"],
    ["a script URL", "javascript:alert(1)"],
    ["an empty string", ""],
    ["a backslash in the middle of the path", "/a\\b"],
    ["an encoded slash in the path", "/%2F%2Fevil.example"],
    ["an encoded backslash in the path", "/%5Cevil.example"],
    ["a lower-case encoded slash in the path", "/a%2fb"],
    ["a lower-case encoded backslash in the path", "/a%5cb"],
    ["a control character (DEL)", "/a\u007fb"],
    ["a control character (NEL)", "/a\u0085b"],
    ["a leading space", " /a"],
  ])("should not allow me to be sent to %s", (_label, value) => {
    expect(safeCallbackPath(value)).toBe("/");
  });

  test.each([undefined, null, 1, ["/a"], { path: "/a" }])(
    "should not allow a value that is not a string (%j)",
    (value) => {
      expect(safeCallbackPath(value)).toBe("/");
    },
  );

  // 本体（Better Auth の isSafeRelativeURL）は、パスの部分だけを見る。クエリの中は、拒否しない
  test("should allow an encoded slash in the query", () => {
    expect(safeCallbackPath("/shrines?next=%2Fa")).toBe("/shrines?next=%2Fa");
  });
});
