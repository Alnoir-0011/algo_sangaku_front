import { describe, test, expect } from "vitest";
import { isPublicPath } from "@/routes";

describe("isPublicPath", () => {
  test.each(["/", "/shrines", "/shrines/1/sangakus", "/profiles/abc", "/play/reorder/12"])(
    "should treat %s as a public path",
    (pathname) => {
      expect(isPublicPath(pathname)).toBe(true);
    },
  );

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
