export const deleteSangaku = async (_id: string): Promise<void> => {};
export const createSangaku = async () => ({});
export const updateSangaku = async () => ({});
export const createReorderSangaku = async () => ({});
export const updateReorderSangaku = async () => ({});
export const generateSource = async () => ({});
// runSource の挙動をテストから制御する。テストファイルとコンポーネントはブラウザ側で別々に
// バンドルされるため、テストから直接書き換えても反映されない。mount の hooksConfig 経由で
// playwright/index.tsx の beforeMount から設定すること（fetchUserSangakuDelay と同じ）。
//   delaysMs: 呼び出し順に適用する遅延（ms）。尽きたら遅延なし
//   rejectCount: 先頭からこの回数だけ reject する（reject は遅延の後）
//   echoSource: true のとき、実行結果に source を含める（どの入力の結果か区別するため）
export const runSourceBehavior: {
  delaysMs: number[];
  rejectCount: number;
  echoSource: boolean;
} = { delaysMs: [], rejectCount: 0, echoSource: false };

export const runSource = async (
  source: string,
  _inputs: string[],
): Promise<string[]> => {
  const delayMs = runSourceBehavior.delaysMs.shift() ?? 0;
  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  if (runSourceBehavior.rejectCount > 0) {
    runSourceBehavior.rejectCount -= 1;
    throw new Error("mock reject");
  }
  return [runSourceBehavior.echoSource ? `output of ${source}` : "mock output"];
};
