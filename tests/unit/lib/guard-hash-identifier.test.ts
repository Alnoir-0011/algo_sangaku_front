import { describe, test, expect, afterEach, vi } from "vitest";

import { hashIdentifier } from "@/app/lib/guard";

describe("hashIdentifier", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("should allow the key to be derived from BETTER_AUTH_SECRET alone", async () => {
    vi.stubEnv("BETTER_AUTH_SECRET", "better-secret");
    vi.stubEnv("AUTH_SECRET", "");

    expect(await hashIdentifier("me@example.com")).toMatch(/^[0-9a-f]{32}$/);
  });

  test("should allow the key to be derived from AUTH_SECRET alone", async () => {
    vi.stubEnv("BETTER_AUTH_SECRET", "");
    vi.stubEnv("AUTH_SECRET", "auth-secret");

    expect(await hashIdentifier("me@example.com")).toMatch(/^[0-9a-f]{32}$/);
  });

  test("should allow the same secret to give the same key to the same person", async () => {
    vi.stubEnv("BETTER_AUTH_SECRET", "better-secret");

    expect(await hashIdentifier("me@example.com")).toBe(
      await hashIdentifier("me@example.com"),
    );
  });

  test("should not allow another person to share my key", async () => {
    vi.stubEnv("BETTER_AUTH_SECRET", "better-secret");

    expect(await hashIdentifier("me@example.com")).not.toBe(
      await hashIdentifier("other@example.com"),
    );
  });

  test("should not allow a different secret to give the same key", async () => {
    vi.stubEnv("BETTER_AUTH_SECRET", "better-secret");
    const first = await hashIdentifier("me@example.com");
    vi.stubEnv("BETTER_AUTH_SECRET", "another-secret");

    expect(await hashIdentifier("me@example.com")).not.toBe(first);
  });

  test("should not allow a key to be derived without any secret", async () => {
    vi.stubEnv("BETTER_AUTH_SECRET", "");
    vi.stubEnv("AUTH_SECRET", "");

    await expect(hashIdentifier("me@example.com")).rejects.toThrow(
      "BETTER_AUTH_SECRET or AUTH_SECRET",
    );
  });
});
