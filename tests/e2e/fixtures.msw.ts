import {
  test as mswBase,
  expect,
  http,
  HttpResponse,
  passthrough,
} from "next/experimental/testmode/playwright/msw";
import { addCoverageReport } from "monocart-reporter";

const test = mswBase.extend<{ autoTestCoverage: void }>({
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

export { test, expect, http, HttpResponse, passthrough };
