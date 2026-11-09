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

export type ReorderDetail = Sangaku;

// 401 のとき取得関数は undefined を返す（それ以外の失敗は null）。再試行しても
// 直らないため、画面では「再試行」ではなく再サインインを案内する。
export class SessionExpiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SessionExpiredError";
  }
}

// 取得関数は失敗を例外ではなく null / undefined で返す。use() に渡す Promise は
// 失敗を reject で表さないと、呼び出し側の Error Boundary で受けられない。
const orThrow = <T>(
  value: T | null | undefined,
  source: string,
  id: string,
): T => {
  if (value === undefined) {
    throw new SessionExpiredError(`${source} unauthorized (id=${id})`);
  }
  if (value === null) {
    throw new Error(`${source} failed (id=${id})`);
  }
  return value;
};

// このファイルに "use server" を付けない。付けると、Sangaku オブジェクトごと受け取る
// 関数が Server Action として公開される。Server Action は、ここから呼ぶ取得関数だけにする。
//
// async にするのは、本体で同期的に投げた例外も reject にするため。同期例外のままだと
// クリックのイベントハンドラの外へ投げられ、Error Boundary で受けられない。
//
// Server Action はクライアントから 1 つずつ dispatch されるため、Promise.all で
// 並べても並列にはならない。読み取りを Route Handler に移せば並列にできるが、
// 新しい公開エンドポイントが増えるので、ここでは見送っている。
export const fetchSangakuModalDetail = async (
  sangaku: Sangaku,
): Promise<SangakuModalDetail> => {
  const shrineId = sangaku.relationships.shrine.data?.id;

  // 神社の取得失敗は例外にしない。fetchShrine は 404 も通信失敗も null で返して区別
  // できず、例外にすると、神社が削除された算額のモーダルが開けなくなる。神社名を
  // 出さずにモーダルを開く。
  const [shrine, result] = await Promise.all([
    shrineId ? fetchShrine(shrineId) : null,
    fetchUserSangakuResult(sangaku.id),
  ]);

  return {
    shrine,
    result: orThrow(result, "fetchUserSangakuResult", sangaku.id),
  };
};

export const fetchReorderDetail = async (id: string): Promise<ReorderDetail> =>
  orThrow(await fetchUserSangaku(id), "fetchUserSangaku", id);
