export type AnswerPayload = { source: string } | { block_ids: number[] };

// back の Answer#source / ReorderSangaku::MAX_CODE_BLOCKS と同値。
// Server Action は "use server" により公開HTTPエンドポイントになるため、
// クライアントの型注釈（union型）は実行時には何も守らない。UIを経由しない
// 直接呼び出し（形の不正なペイロード）を back に転送する前に弾く
export const MAX_SOURCE_LENGTH = 65_535;
export const MAX_BLOCK_IDS = 100;

// 検証済みの payload のみを返す。"source" と "block_ids" の両方を含む
// オブジェクトを直接渡された場合でも、判定に使った側のフィールドだけを
// 転送し、もう片方の未検証フィールドが素通りしないようにする
// （payload をそのまま転送すると union の排他性を保証できない）。
export function validateAnswerPayload(payload: unknown): AnswerPayload | null {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  if ("source" in payload) {
    const { source } = payload as { source: unknown };
    if (typeof source === "string" && source.length <= MAX_SOURCE_LENGTH) {
      return { source };
    }
    return null;
  }

  if ("block_ids" in payload) {
    const blockIds = validateBlockIds(
      (payload as { block_ids: unknown }).block_ids,
    );
    return blockIds ? { block_ids: blockIds } : null;
  }

  return null;
}

// 空・上限超過・非正整数・重複のいずれかを含む場合は null を返す
export function validateBlockIds(blockIds: unknown): number[] | null {
  const isValid =
    Array.isArray(blockIds) &&
    blockIds.length > 0 &&
    blockIds.length <= MAX_BLOCK_IDS &&
    blockIds.every((id) => Number.isInteger(id) && id > 0) &&
    new Set(blockIds).size === blockIds.length;
  return isValid ? (blockIds as number[]) : null;
}
