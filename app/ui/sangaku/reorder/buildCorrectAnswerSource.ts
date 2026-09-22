import type { CodeBlock } from "@/app/lib/definitions";

// 解答済みの場合、back（PublicSangakuDetailSerializer）は code_blocks を
// 正解ブロックが correct_position 昇順、ダミーブロックがその後ろ（id 昇順）という
// 並びで返す（issue #92）。ここではダミーブロック（correct_position が null/undefined）を
// 除外し、正解ブロックの content を改行区切りで結合して「正解のコード」を組み立てる。
// 並べ替え形式は提出した並びを保存しない（issue #278）ため、解答結果ページでは
// ユーザーの提出物ではなくこの正解コードを表示する。
export function buildCorrectAnswerSource(codeBlocks: CodeBlock[]): string {
  return codeBlocks
    .filter(
      (block) =>
        block.correct_position !== null && block.correct_position !== undefined,
    )
    .sort((a, b) => (a.correct_position ?? 0) - (b.correct_position ?? 0))
    .map((block) => block.content)
    .join("\n");
}
