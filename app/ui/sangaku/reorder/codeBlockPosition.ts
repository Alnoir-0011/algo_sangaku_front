import type { CodeBlockDraft } from "@/app/ui/sangaku/reorder/CodeBlockEditor";

// 非ダミーブロックのみをカウントし、出現順に1始まりの連番（back の correct_position
// 相当）を割り当てる。ダミーブロックは連番のカウント対象外のため null を返す。
// ReorderCheckPage（表示ラベルの算出）と ReorderSangakuForm（送信ペイロードへの変換）の
// 両方で「非ダミーブロックのみを数えて連番を振る」ロジックが必要なため、ここに共通化する。
export function assignCorrectPositions(
  blocks: CodeBlockDraft[],
): (number | null)[] {
  let position = 0;
  return blocks.map((block) => {
    if (block.isDummy) {
      return null;
    }
    position += 1;
    return position;
  });
}
