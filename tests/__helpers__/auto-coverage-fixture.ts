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
    await addCoverageReport(jsCoverage, testInfo);
  }
}
