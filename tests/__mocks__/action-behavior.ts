// Server Action のモックを保留し、呼び出し回数を記録する。「送信中」の状態を作って、
// 連打しても1回しか呼ばれないことを検証するために使う。
// 時間で遅らせると、「送信中」の窓を toBeDisabled が拾えるかが負荷に左右されるため、
// テストが解放するまで保留する。
// テストファイルとコンポーネントはブラウザ側で別々にバンドルされるため、hold と rejectCount は
// テストから直接書き換えても反映されない。mount の hooksConfig（actionHold / actionRejectCount）経由で
// playwright/index.tsx の beforeMount から設定する。呼び出し回数の読み取りと保留の解放は、
// page.evaluate で行う（window.__actionCalls / window.__releaseActions）。
// 解放は、保留に入ったこと（例: ボタンが disabled になったこと）を確認してから行う。
// 保留に入る前に呼ぶと何も解放されず、その後の保留が残り続ける。
export const actionBehavior = { hold: false, rejectCount: 0 };

declare global {
  interface Window {
    __actionCalls?: Record<string, number>;
    __releaseActions?: () => void;
  }
}

export const simulateAction = async (name: string): Promise<void> => {
  window.__actionCalls = window.__actionCalls ?? {};
  window.__actionCalls[name] = (window.__actionCalls[name] ?? 0) + 1;
  if (actionBehavior.rejectCount > 0) {
    actionBehavior.rejectCount -= 1;
    throw new Error(`${name} failed`);
  }
  if (actionBehavior.hold) {
    await new Promise<void>((resolve) => {
      const release = window.__releaseActions;
      window.__releaseActions = () => {
        release?.();
        window.__releaseActions = undefined;
        resolve();
      };
    });
  }
};
