import { Page, Locator } from "@playwright/test";

/**
 * 操作対象要素が visible になるまで待つ。
 * React 19 hydration の完了を保証するものではないため、
 * 実際の enabled/disabled 確認は呼び出し側で toBeEnabled({ timeout: 10_000 }) を使うこと。
 */
export async function waitForInteractive(locator: Locator) {
  await locator.waitFor({ state: "visible", timeout: 10_000 });
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
 */
export async function waitForMonacoEditor(page: Page, nth = 0) {
  await page
    .locator(".monaco-editor")
    .nth(nth)
    .locator(".view-lines")
    .waitFor({ state: "visible", timeout: 20_000 });
}
