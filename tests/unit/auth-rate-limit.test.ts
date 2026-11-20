import { describe, test, expect, vi } from "vitest";

// Better Auth のレート制限は、本番でだけ既定が有効になる。本番と同じ条件を、import より前に用意する
vi.hoisted(() => {
  vi.stubEnv("NODE_ENV", "production");
  process.env.BETTER_AUTH_SECRET = "test-secret-for-rate-limit-0123456789012";
  process.env.BETTER_AUTH_URL = "http://localhost:4020";
  process.env.AUTH_GOOGLE_ID = "google-client-id";
  process.env.AUTH_GOOGLE_SECRET = "google-client-secret";
  process.env.API_URL = "http://api.test";
});

vi.mock("@/app/lib/set-flash", () => ({ setFlash: vi.fn() }));

import { auth } from "@/auth";

const ORIGIN = "http://localhost:4020";

const get = (path: string, ip: string) =>
  auth.handler(
    new Request(`${ORIGIN}/api/auth${path}`, {
      headers: { "x-forwarded-for": ip },
    }),
  );

const statuses = async (path: string, ip: string, count: number) => {
  const result: number[] = [];
  for (let i = 0; i < count; i++) result.push((await get(path, ip)).status);
  return result;
};

describe("rate limit of the auth API", () => {
  test("should not allow the rate limit to be skipped by accident for other paths", async () => {
    // 制限が有効な条件で動いていることの確認。これが 429 を返さないと、下のテストは意味を持たない
    const result = await statuses("/ok", "203.0.113.1", 150);

    expect(result).toContain(429);
  });

  test("should allow the session check to be called many times from the same IP", async () => {
    const result = await statuses("/get-session", "203.0.113.2", 150);

    expect(result.filter((status) => status !== 200)).toEqual([]);
  });
});
