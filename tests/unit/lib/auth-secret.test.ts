import { describe, test, expect, afterEach, vi } from "vitest";

import { resolveAuthSecret } from "@/app/lib/auth-secret";

// resolveAuthSecret（認証シークレットの解決）
describe("resolveAuthSecret", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // BETTER_AUTH_SECRET が優先される
  test("should allow BETTER_AUTH_SECRET to take priority", () => {
    vi.stubEnv("BETTER_AUTH_SECRET", "better");
    vi.stubEnv("AUTH_SECRET", "auth");

    expect(resolveAuthSecret()).toBe("better");
  });

  // BETTER_AUTH_SECRET が空のとき、AUTH_SECRET が使われる
  test("should allow AUTH_SECRET to be used when BETTER_AUTH_SECRET is empty", () => {
    vi.stubEnv("BETTER_AUTH_SECRET", "");
    vi.stubEnv("AUTH_SECRET", "auth");

    expect(resolveAuthSecret()).toBe("auth");
  });

  // BETTER_AUTH_SECRET と AUTH_SECRET がどちらも空のとき、空文字がそのまま返る（拒否は呼び出し側の責務）
  test("should not allow an empty secret to be used", () => {
    vi.stubEnv("BETTER_AUTH_SECRET", "");
    vi.stubEnv("AUTH_SECRET", "");

    expect(resolveAuthSecret()).toBe("");
  });

  // シークレットが未設定のとき、代わりの値を勝手に生成しない
  test("should not allow a secret to be made up when none is set", () => {
    vi.stubEnv("BETTER_AUTH_SECRET", undefined);
    vi.stubEnv("AUTH_SECRET", undefined);

    expect(resolveAuthSecret()).toBeUndefined();
  });
});
