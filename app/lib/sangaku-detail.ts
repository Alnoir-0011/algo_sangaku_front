import type { Sangaku, SangakuResult, Shrine } from "@/app/lib/definitions";
import { fetchShrine } from "@/app/lib/data/shrine";
import {
  fetchUserSangaku,
  fetchUserSangakuResult,
} from "@/app/lib/data/sangaku";

export type SangakuModalDetail = {
  shrine: Shrine | null;
  result: SangakuResult;
};

export type ReorderDetail = Promise<Sangaku>;

// 取得関数は失敗を例外ではなく null / undefined で返す。use() に渡す Promise は
// 失敗を reject で表さないと、呼び出し側の Error Boundary で受けられない。
const orThrow = <T>(value: T | null | undefined, message: string): T => {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
  return value;
};

// Server Action はクライアントから 1 つずつ dispatch されるため、Promise.all で
// 並べても並列にはならない。読み取りを Route Handler に移せば並列にできるが、
// 新しい公開エンドポイントが増えるので、ここでは見送っている。
export const fetchSangakuModalDetail = (
  sangaku: Sangaku,
): Promise<SangakuModalDetail> => {
  const shrineId = sangaku.relationships.shrine.data?.id;

  return Promise.all([
    shrineId ? fetchShrine(shrineId) : Promise.resolve(null),
    fetchUserSangakuResult(sangaku.id),
  ]).then(([shrine, result]) => ({
    shrine,
    result: orThrow(result, "fetchUserSangakuResult failed"),
  }));
};

export const fetchReorderDetail = (id: string): ReorderDetail =>
  fetchUserSangaku(id).then((sangaku) =>
    orThrow(sangaku, "fetchUserSangaku failed"),
  );
