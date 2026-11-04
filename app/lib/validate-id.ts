// back の主キーは全て bigint（数値文字列）。Server Action の引数はクライアントが
// 完全に制御できるため、URL に補間する前に想定外の値（パストラバーサル等）を弾く。
// 引数は配列など文字列以外も渡せる。正規表現だけだと ["123"] が "123" に文字列化されて通る。
export function isValidId(id: string): boolean {
  return typeof id === "string" && /^\d+$/.test(id);
}
