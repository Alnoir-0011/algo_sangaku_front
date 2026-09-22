import type { CodeBlock, PuzzleBlock } from "@/app/lib/definitions";

// CodeBlock（correct_position を含みうる、back の詳細レスポンス由来の型）から
// id・content のみの PuzzleBlock に変換する。back は未解答者に correct_position を
// 返さない契約だが、CodeBlock 型のまま ReorderPuzzle（Client Component）へ渡すと
// 正解情報を保持しうる型のまま RSC のシリアライズ対象になってしまうため、
// 出題画面に渡す直前でこの変換を通し、props がそもそも正解情報を持てないようにする
// （issue #92 quick-review 対応）。
export function toPuzzleBlocks(codeBlocks: CodeBlock[]): PuzzleBlock[] {
  return codeBlocks.map(({ id, content }) => ({ id, content }));
}
