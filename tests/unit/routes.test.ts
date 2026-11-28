import { describe, test, expect } from "vitest";
import { isPublicPath } from "@/routes";

// isPublicPath（公開パスの判定）
describe("isPublicPath", () => {
  // %s を公開パスとして扱う
  test.each(["/", "/shrines", "/shrines/1/sangakus", "/profiles/abc", "/play/reorder/12"])(
    "should treat %s as a public path",
    (pathname) => {
      expect(isPublicPath(pathname)).toBe(true);
    },
  );

  // %s を公開パスとして扱わない
  test.each([
    "/sangakus/create",
    "/user/sangakus",
    "/saved_sangakus",
    "/shrines/1/dedicate",
    "/admin",
  ])("should not treat %s as a public path", (pathname) => {
    expect(isPublicPath(pathname)).toBe(false);
  });
});
