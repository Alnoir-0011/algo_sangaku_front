import type { Flash } from "@/app/lib/actions/flash";

export type { FlashType, Flash } from "@/app/lib/actions/flash";

// consumeFlash の挙動をテストから制御する。テストファイルとコンポーネントはブラウザ側で
// 別々にバンドルされるため、mount の hooksConfig 経由で playwright/index.tsx の
// beforeMount から設定すること。
//   queue: 呼び出し順に返すフラッシュ（本物は cookie を読んで消す）。尽きたら null
//   rejectCount: 先頭からこの回数だけ reject する
export const consumeFlashBehavior: {
  queue: (Flash | null)[];
  rejectCount: number;
} = { queue: [], rejectCount: 0 };

export const setFlash = async () => {};
export const consumeFlash = async (): Promise<Flash | null> => {
  if (consumeFlashBehavior.rejectCount > 0) {
    consumeFlashBehavior.rejectCount -= 1;
    throw new Error("mock reject");
  }
  return consumeFlashBehavior.queue.shift() ?? null;
};
