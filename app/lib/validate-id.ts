// back の主キーは全て bigint（数値文字列）。Server Action の引数はクライアントが
// 完全に制御できるため、URL に補間する前に想定外の値（パストラバーサル等）を弾く。
export function isValidId(id: string): boolean {
  return /^\d+$/.test(id);
}
