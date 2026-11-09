import type { ReorderCodeBlockInput } from "@/app/lib/definitions";

// back の ReorderSangaku::MAX_CODE_BLOCKS / CodeBlock#content の length 上限と同値。
// Server Action は "use server" により公開HTTPエンドポイントになるため、
// クライアントの型注釈は実行時には何も守らない。UIを経由しない直接呼び出し
// （不正な形・巨大なペイロード等）を back に転送する前に弾く
const MAX_CODE_BLOCKS = 100;
const MAX_CODE_BLOCK_CONTENT_LENGTH = 2000;

// codeBlocks 単体の形の検証。ユーザー向け actions/sangaku.ts（createReorderSangaku/
// updateReorderSangaku）と管理画面向け actions/admin.ts（updateSangaku）の両方で
// 同じ検証が必要なため、どちらにも属さないこのファイルに置く。
//
// "use server" ディレクティブを持つファイルからは async 関数以外を export できない
// （Next.js の制約: Server Actions must be async functions）ため、この型ガード関数
// （同期関数）は "use server" ではない独立したファイルに置く必要がある
// （actions/sangaku.ts に直接置いて export した結果ビルドエラーになった実績あり）。
//
// correct_position の上限は「ダミーを除く正解ブロック数」であり codeBlocks の
// 要素数を超えないため、MAX_CODE_BLOCKS をそのまま範囲チェックに使う。
export function isValidCodeBlocks(
  codeBlocks: unknown,
): codeBlocks is ReorderCodeBlockInput[] {
  return (
    Array.isArray(codeBlocks) &&
    codeBlocks.length > 0 &&
    codeBlocks.length <= MAX_CODE_BLOCKS &&
    codeBlocks.every(
      (block) =>
        typeof block === "object" &&
        block !== null &&
        typeof block.content === "string" &&
        block.content.length <= MAX_CODE_BLOCK_CONTENT_LENGTH &&
        (block.correct_position === null ||
          (Number.isInteger(block.correct_position) &&
            block.correct_position >= 1 &&
            block.correct_position <= MAX_CODE_BLOCKS)),
    )
  );
}
