import { describe, test, expect, afterEach, vi } from "vitest";

import { resolveAuthSecret } from "@/app/lib/auth-secret";

describe("resolveAuthSecret", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("should allow BETTER_AUTH_SECRET to take priority", () => {
    vi.stubEnv("BETTER_AUTH_SECRET", "better");
    vi.stubEnv("AUTH_SECRET", "auth");

    expect(resolveAuthSecret()).toBe("better");
  });

  test("should allow AUTH_SECRET to be used when BETTER_AUTH_SECRET is empty", () => {
    vi.stubEnv("BETTER_AUTH_SECRET", "");
    vi.stubEnv("AUTH_SECRET", "auth");

    expect(resolveAuthSecret()).toBe("auth");
  });

  test("should not allow an empty secret to be used", () => {
    vi.stubEnv("BETTER_AUTH_SECRET", "");
    vi.stubEnv("AUTH_SECRET", "");

    expect(resolveAuthSecret()).toBe("");
  });

  test("should not allow a secret to be made up when none is set", () => {
    vi.stubEnv("BETTER_AUTH_SECRET", undefined);
    vi.stubEnv("AUTH_SECRET", undefined);

    expect(resolveAuthSecret()).toBeUndefined();
  });
});
