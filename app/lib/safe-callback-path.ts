const DEFAULT_CALLBACK_PATH = "/";

const PARSER_ORIGIN = "https://callback.invalid";

// Server Action から auth.api.signInSocial を直接呼ぶと、Better Auth は callbackURL を検証しない
// （api/middlewares/origin-check.mjs が、ctx.request の無い呼び出しで早期に戻る）。
// ここが唯一の防御になるため、本体の isSafeRelativeURL（auth/trusted-origins.mjs）と
// 同じ条件にそろえる。先頭の "/" だけでは足りない。"//host" と "/\host" はブラウザが別オリジンと
// 解釈し、タブや改行は URL から取り除かれる。パスの途中の "\" は "/" とみなされ、
// パスの中の "%2F" と "%5C" は、デコードして遷移する経路が加わったときに別のパスになる
export function safeCallbackPath(raw: unknown): string {
  if (typeof raw !== "string") return DEFAULT_CALLBACK_PATH;
  if (
    !raw.startsWith("/") ||
    raw.startsWith("//") ||
    raw.includes("\\") ||
    /[\u0000-\u001f\u007f-\u009f]/.test(raw)
  ) {
    return DEFAULT_CALLBACK_PATH;
  }

  const pathEnd = raw.search(/[?#]/);
  const path = pathEnd === -1 ? raw : raw.slice(0, pathEnd);
  if (/%2[fF]|%5[cC]/.test(path)) return DEFAULT_CALLBACK_PATH;

  try {
    return new URL(raw, PARSER_ORIGIN).origin === PARSER_ORIGIN
      ? raw
      : DEFAULT_CALLBACK_PATH;
  } catch {
    return DEFAULT_CALLBACK_PATH;
  }
}
