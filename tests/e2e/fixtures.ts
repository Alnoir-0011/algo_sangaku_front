import { test as e2eBase, expect } from "@playwright/test";
import { addCoverageReport } from "monocart-reporter";

const test = e2eBase.extend<{ autoTestCoverage: void }>({
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
