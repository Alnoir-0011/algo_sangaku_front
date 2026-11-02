import { Page, Locator, expect } from "@playwright/test";

/**
 * 操作対象要素が visible になるまで待つ。
 * React 19 hydration の完了を保証するものではないため、
 * 実際の enabled/disabled 確認は呼び出し側で toBeEnabled({ timeout: 10_000 }) を使うこと。
 */
export async function waitForInteractive(locator: Locator) {
  await locator.waitFor({ state: "visible", timeout: 10_000 });
}

/**
 * 操作対象要素に React のイベントハンドラが付く（hydration される）まで待つ。
 * visible 判定だけでは SSR 済みの HTML も通ってしまい、hydration 前に fill すると
 * onChange が発火せず入力が失われる（遅い CI の WebKit で発生）。
 * hydration の完了を示す公開 API はないため、React が hydrate 時に要素へ付ける
 * 内部プロパティ（__reactProps$）の有無で判定している。
 */
export async function waitForHydration(locator: Locator) {
  await locator.waitFor({ state: "visible", timeout: 10_000 });
  await expect
    .poll(
      () =>
        locator.evaluate((el) =>
          Object.keys(el).some((key) => key.startsWith("__reactProps$")),
        ),
      { timeout: 15_000 },
    )
    .toBe(true);
}

/**
 * ネットワークが静止するまで待つ。
 * MSW mock を通過する非同期リクエストが完了していることを確認したい場面で使う。
 */
export async function waitForNetworkIdle(page: Page) {
  await page.waitForLoadState("networkidle");
}

/**
 * Monaco Editor が完全に読み込まれるまで待つ。
 * .view-lines が visible になった時点で Monaco の初期化とレンダリングが完了している。
 * @param page - Playwright の Page オブジェクト
 * @param nth  - ページ内に複数の Monaco Editor がある場合のインデックス（デフォルト: 0）
 * @param testId - Monaco Editor を包む要素の data-testid（デフォルト: "monaco-editor-source"。
 *                 CodeBlockEditor.tsx の分割前コード入力は "monaco-editor-block-input"）
 */
export async function waitForMonacoEditor(
  page: Page,
  nth = 0,
  testId = "monaco-editor-source",
) {
  await page
    .getByTestId(testId)
    .nth(nth)
    .locator(".view-lines")
    .waitFor({ state: "visible", timeout: 30_000 });
}

type MonacoOperation = { type: "get" } | { type: "set"; value: string };

// キー操作（ControlOrMeta+a）での全選択は使わない。Monaco は userAgent から OS を判定して
// キーを割り当てるため、実行 OS と userAgent が食い違うブラウザで全選択にならない。
// 編集内容の確認に DOM の .view-lines は使わない。行が連結されて改行の有無を区別できない。
async function operateMonacoEditor(
  page: Page,
  nth: number,
  testId: string,
  operation: MonacoOperation,
): Promise<string> {
  return page
    .getByTestId(testId)
    .nth(nth)
    .evaluate((wrapper, op) => {
      type MonacoEditor = {
        getContainerDomNode(): HTMLElement;
        getValue(): string;
        setValue(value: string): void;
      };
      const { monaco } = window as unknown as {
        monaco?: { editor: { getEditors(): MonacoEditor[] } };
      };
      if (!monaco) {
        throw new Error(
          "window.monaco is not loaded. Call waitForMonacoEditor before operating the editor",
        );
      }
      const editor = monaco.editor
        .getEditors()
        .find((e) => wrapper.contains(e.getContainerDomNode()));
      if (!editor) throw new Error("Monaco Editor not found in the given wrapper");
      if (op.type === "set") editor.setValue(op.value);
      return editor.getValue();
    }, operation);
}

export async function setMonacoEditorValue(
  page: Page,
  value: string,
  nth = 0,
  testId = "monaco-editor-source",
) {
  await operateMonacoEditor(page, nth, testId, { type: "set", value });
}

export async function getMonacoEditorValue(
  page: Page,
  nth = 0,
  testId = "monaco-editor-source",
) {
  return operateMonacoEditor(page, nth, testId, { type: "get" });
}
