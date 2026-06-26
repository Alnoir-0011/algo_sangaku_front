import { buildHeaders } from "@/app/lib/client_headers";

/**
 * Server Actions / data 層共通の fetch ラッパー。
 * buildHeaders によるトークン注入を一元化する。
 * isRedirectError の処理は呼び出し側で行う。
 */
export async function serverFetch(
  url: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<Response> {
  const { token, ...rest } = options;
  return fetch(url, {
    ...rest,
    headers: buildHeaders(token),
  });
}
