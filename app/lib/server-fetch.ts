import { buildHeaders } from "@/app/lib/client_headers";
import { DEFAULT_NETWORK_TIMEOUT_MS } from "@/app/lib/config";

/**
 * Server Actions / data 層共通の fetch ラッパー。
 * buildHeaders によるトークン注入を一元化する。
 * isRedirectError の処理は呼び出し側で行う。
 * デフォルトで10秒のタイムアウトを設定し、応答が返らず呼び出し元の
 * isLoading 等の状態が固まり続けることを防ぐ。OpenAI 呼び出しのように
 * 10秒を超えうる処理は呼び出し側で timeoutMs を指定して上書きする。
 */
export async function serverFetch(
  url: string,
  options: RequestInit & { token?: string | null; timeoutMs?: number } = {},
): Promise<Response> {
  const { token, signal, timeoutMs = DEFAULT_NETWORK_TIMEOUT_MS, ...rest } = options;
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  return fetch(url, {
    ...rest,
    headers: buildHeaders(token),
    // 呼び出し元が signal を渡しても、タイムアウト保護は常にかかるようにする
    signal: signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal,
  });
}
