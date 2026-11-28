import "server-only";
import { serverFetch } from "@/app/lib/server-fetch";
import { apiUrl } from "@/app/lib/config";

// ベストエフォートの副作用なので、バックエンドがハングしていてもサインアウトを待たせない
export const BACKEND_SIGN_OUT_TIMEOUT_MS = 3_000;

// serverFetch の timeoutMs（AbortSignal.timeout）は、Better Auth のフックの中では発火せず、
// バックエンドが応答しないと fetch が決着しないまま処理が固まった。応答しないスタブサーバーを
// API_URL に指定した、Next の開発サーバーでの実測による。原因は特定しておらず、vitest では
// 再現しない（Next が fetch を差し替えているため）ので、自動テストでは確かめられない。
// そのため AbortController と setTimeout で自前に中断する。
// 本文の読み取りまで保護するため、fetch ではなく処理全体を包む
export async function withTimeout<T>(
  timeoutMs: number,
  run: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await run(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

// バックエンドの DELETE が失敗しても front のサインアウトは止めない
export async function revokeRailsApiKey(accessToken: string) {
  try {
    const response = await withTimeout(BACKEND_SIGN_OUT_TIMEOUT_MS, (signal) =>
      serverFetch(`${apiUrl}/api/v1/authenticate`, {
        method: "DELETE",
        token: accessToken,
        signal,
      }),
    );
    // 401 は ApiKey がすでに無効という意味で、障害ではない
    if (!response.ok && response.status !== 401) {
      console.error("[auth] backend sign-out failed:", response.status);
    }
    // 本文は使わない。読まずに残すと、接続が解放されるまで保持される
    await response.body?.cancel();
  } catch (error) {
    console.error("[auth] backend sign-out failed:", error);
  }
}
