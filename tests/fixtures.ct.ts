import {
  test as ctBase,
  expect,
} from "@playwright/experimental-ct-react";
import { addCoverageReport } from "monocart-reporter";

const test = ctBase.extend<{ autoTestCoverage: void }>({
  autoTestCoverage: [
    async ({ page }, use) => {
      const isChromium = test.info().project.name === "chromium";
      if (isChromium) {
        await page.coverage.startJSCoverage({ resetOnNavigation: false });
      }
      await use();
      if (isChromium) {
        const jsCoverage = await page.coverage.stopJSCoverage();
        await addCoverageReport(jsCoverage, test.info());
      }
    },
    { scope: "test", auto: true },
  ],
});

export { test, expect };
