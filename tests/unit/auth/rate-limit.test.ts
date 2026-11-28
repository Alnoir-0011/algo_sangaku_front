import { describe, test, expect, vi } from "vitest";

// Better Auth のレート制限は、本番でだけ既定が有効になる。本番と同じ条件にする。
// NODE_ENV は、このファイルの中だけで有効（ファイルごとに別のプロセスで動くため、戻さない）
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

// 制限の状態は IP ごとに分かれる。テスト間で状態が混ざらないよう、テストごとに別の IP を使う
describe("rate limit of the auth API", () => {
  // 制限が有効な条件で動いていることの確認。これが 429 を返さないと、下のテストは意味を持たない
  test("should not allow more than 100 requests to the other paths from the same IP in 10 seconds", async () => {
    const result = await statuses("/ok", "203.0.113.1", 101);

    expect(result.slice(0, 100).filter((status) => status !== 200)).toEqual([]);
    expect(result[100]).toBe(429);
  });

  // 同じ IP（学校やオフィスの NAT など）から、フォーカス復帰や遷移ごとの再取得が、多数届く。
  // 未認証でも叩ける処理なので、無制限にはしない
  test("should allow me to check my session 300 times but not 301 times in 10 seconds from the same IP", async () => {
    const result = await statuses("/get-session", "203.0.113.2", 301);

    expect(result.slice(0, 300).filter((status) => status !== 200)).toEqual([]);
    expect(result[300]).toBe(429);
  });

  test("should not allow another IP to be limited because of my session checks", async () => {
    await statuses("/get-session", "203.0.113.3", 301);

    expect((await get("/get-session", "203.0.113.4")).status).toBe(200);
  });
});
