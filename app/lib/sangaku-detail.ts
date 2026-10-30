import type { Sangaku, SangakuResult, Shrine } from "@/app/lib/definitions";
import { fetchShrine } from "@/app/lib/data/shrine";
import {
  fetchUserSangaku,
  fetchUserSangakuResult,
} from "@/app/lib/data/sangaku";

export type SangakuModalDetail = {
  shrine: Shrine | null;
  result: SangakuResult | null | undefined;
};

export type ReorderDetail = Promise<Sangaku | null | undefined>;

// use() は reject を ErrorBoundary に伝播し、ページ全体がエラー画面になる。
// 取得失敗はモーダル内で完結させたいので、ログを残したうえで null として扱う。
// 取得関数自身の console.error はサーバー側の失敗しか拾えず、Server Action の
// 呼び出し自体の失敗（セッション切れの 302、通信断、デプロイ直後など）は
// ここで記録しないと誰にも残らない。
const logAndFallback = <T>(name: string, fallback: T) => (error: unknown) => {
  console.error(`[sangaku-detail] ${name} error:`, error);
  return fallback;
};

// Server Action はクライアントから 1 つずつ dispatch されるため、Promise.all で
// 並べても並列にはならない。1 つの Server Action にまとめれば並列にできるが、
// データ層に新しい公開エンドポイントが増えるので、ここでは見送っている。
export const fetchSangakuModalDetail = (
  sangaku: Sangaku,
): Promise<SangakuModalDetail> => {
  const shrineId = sangaku.relationships.shrine.data?.id;

  return Promise.all([
    shrineId ? fetchShrine(shrineId) : Promise.resolve(null),
    fetchUserSangakuResult(sangaku.id),
  ])
    .then(([shrine, result]) => ({ shrine, result }))
    .catch(
      logAndFallback<SangakuModalDetail>("fetchSangakuModalDetail", {
        shrine: null,
        result: null,
      }),
    );
};

export const fetchReorderDetail = (id: string): ReorderDetail =>
  fetchUserSangaku(id).catch(logAndFallback("fetchReorderDetail", null));
