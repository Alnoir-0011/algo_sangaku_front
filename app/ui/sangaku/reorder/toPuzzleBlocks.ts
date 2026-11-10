import "server-only";
import type { CodeBlock, PuzzleBlock } from "@/app/lib/definitions";

// 配列をシャッフルした新しい配列を返す（Fisher-Yates）。
// Fisher-Yates は元と同じ並びも返しうる（2個なら 1/2）。入力が正解順のとき
// 正解順のまま出題されるのを避けるため、同じ並びになったら先頭を末尾へ回す。
function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  const keptOrder = result.every((item, index) => item === items[index]);
  return keptOrder && result.length >= 2
    ? [...result.slice(1), result[0]]
    : result;
}

// CodeBlock（correct_position を含みうる、back の詳細レスポンス由来の型）から
// id・content のみの PuzzleBlock に変換し、並びをシャッフルして返す。
//
// 型の変換: back は未解答者に correct_position を返さない契約だが、CodeBlock 型の
// まま ReorderPuzzle（Client Component）へ渡すと正解情報を保持しうる型のまま
// RSC のシリアライズ対象になってしまうため、出題画面に渡す直前でこの変換を通し、
// props がそもそも正解情報を持てないようにする（issue #92 quick-review 対応）。
//
// シャッフルをここに置く理由: back は未解答者には毎回シャッフルして返すが、作者・
// 解答済みの人には正解順で返す。それだけに依存せず front でも独立してシャッフルする
// 多層防御にする。ReorderPuzzle（Client Component）の useState 初期化でシャッフルすると
// SSR と hydration で別々に走って並びが食い違い、hydration エラーになる。また、
// 呼び出し側ごとにシャッフルすると呼び忘れで防御の1層が抜けるため、両方の呼び出し元が
// 必ず通るこの関数に集約する。useEffect でシャッフルする案は、最初の描画が props の
// 並び（正解順）になり、react-hooks/set-state-in-effect にも反するため採らない。
export function toPuzzleBlocks(codeBlocks: CodeBlock[]): PuzzleBlock[] {
  return shuffle(codeBlocks.map(({ id, content }) => ({ id, content })));
}
