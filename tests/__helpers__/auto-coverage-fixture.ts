import type { Page, TestInfo } from "@playwright/test";
import { addCoverageReport } from "monocart-reporter";

export async function runWithAutoCoverage(
  page: Page,
  testInfo: TestInfo,
  use: () => Promise<void>,
) {
  const isChromium = testInfo.project.name === "chromium";
  if (isChromium) {
    await page.coverage.startJSCoverage({ resetOnNavigation: false });
  }
  await use();
  if (isChromium) {
    const jsCoverage = await page.coverage.stopJSCoverage();
    // request のみで完結するテスト（page.goto を呼ばない）は about:blank のまま
    // JS coverage の対象がなく、空データを渡すと monocart 側で
    // 「must be Array(V8) or Object(Istanbul)」という警告が出る。
    // ページ遷移が実際に起きたときだけレポートする。
    if (page.url() !== "about:blank") {
      await addCoverageReport(jsCoverage, testInfo);
    }
  }
}
