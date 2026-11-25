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

  // 同じ IP（学校やオフィスの NAT など）から、フォーカス復帰や遷移ごとの再取得が、多数届く
  test("should allow the session check to be called up to 300 times in 10 seconds from the same IP", async () => {
    const result = await statuses("/get-session", "203.0.113.2", 300);

    expect(result.filter((status) => status !== 200)).toEqual([]);
  });

  // 未認証でも叩ける処理なので、無制限にはしない
  test("should not allow the session check to be called more than 300 times in 10 seconds from the same IP", async () => {
    const result = await statuses("/get-session", "203.0.113.3", 301);

    expect(result.slice(0, 300).filter((status) => status !== 200)).toEqual([]);
    expect(result[300]).toBe(429);
  });

  test("should not allow the session check of one IP to use up the limit of another IP", async () => {
    await statuses("/get-session", "203.0.113.4", 301);

    expect((await get("/get-session", "203.0.113.5")).status).toBe(200);
  });
});
