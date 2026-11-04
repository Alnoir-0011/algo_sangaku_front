import { describe, test, expect } from "vitest";
import { isValidId } from "@/app/lib/validate-id";

describe("isValidId", () => {
  test.each(["1", "123", "0", "9007199254740993"])(
    "should accept %j as an id",
    (id) => {
      expect(isValidId(id)).toBe(true);
    },
  );

  test.each(["", "abc", "12a", "1 2", "-1", "1.5", "../1", "1/2", "1\n"])(
    "should reject %j as an id",
    (id) => {
      expect(isValidId(id)).toBe(false);
    },
  );

  // Server Action の引数は Flight 経由で配列などの文字列以外も渡せる。
  // 正規表現だけだと ["123"] が "123" に文字列化されて通ってしまう。
  test.each([["123"], 123, null, undefined, { toString: () => "123" }])(
    "should reject a non-string value %j",
    (id) => {
      expect(isValidId(id as unknown as string)).toBe(false);
    },
  );
});
