// バックエンドの render_error は、バリデーション失敗時は [[key, string[]]] の
// entries 配列を返す一方、ActionController::ParameterMissing 時などは
// フラットな文字列配列を返すことがあるため、要素の形状まで検証してから変換する。
export function parseApiErrors(raw: unknown): Record<string, string[]> {
  if (!Array.isArray(raw)) {
    return {};
  }

  const entries = raw.filter(
    (entry): entry is [string, string[]] =>
      Array.isArray(entry) &&
      entry.length === 2 &&
      typeof entry[0] === "string" &&
      Array.isArray(entry[1]) &&
      entry[1].every((message) => typeof message === "string"),
  );

  return Object.fromEntries(entries);
}
