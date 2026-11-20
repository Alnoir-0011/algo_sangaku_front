import type { Flash } from "@/app/lib/actions/flash";

export type { FlashType, Flash } from "@/app/lib/actions/flash";

// consumeFlash の挙動をテストから制御する。テストファイルとコンポーネントはブラウザ側で
// 別々にバンドルされるため、mount の hooksConfig 経由で playwright/index.tsx の
// beforeMount から設定すること。
//   queue: 呼び出し順に返すフラッシュ（本物は cookie を読んで消す）。尽きたら null
//   rejectCount: 先頭からこの回数だけ reject する
//   delaysMs: 呼び出し順の応答の遅延（ms）。本物は、呼び出しの時点で cookie を読んで消し、
//             応答がネットワークの分だけ遅れる。返す値は呼び出しの時点で決め、遅らせるのは応答だけ
export const consumeFlashBehavior: {
  queue: (Flash | null)[];
  rejectCount: number;
  delaysMs: number[];
} = { queue: [], rejectCount: 0, delaysMs: [] };

export const consumeFlash = async (): Promise<Flash | null> => {
  if (consumeFlashBehavior.rejectCount > 0) {
    consumeFlashBehavior.rejectCount -= 1;
    throw new Error("mock reject");
  }
  const flash = consumeFlashBehavior.queue.shift() ?? null;
  const delayMs = consumeFlashBehavior.delaysMs.shift() ?? 0;
  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return flash;
};
