import {
  test as ctBase,
  expect,
} from "@playwright/experimental-ct-react";
import { runWithAutoCoverage } from "./__helpers__/auto-coverage-fixture";

const test = ctBase.extend<{ autoTestCoverage: void }>({
  autoTestCoverage: [
    async ({ page }, use, testInfo) => {
      await runWithAutoCoverage(page, testInfo, use);
    },
    { scope: "test", auto: true },
  ],
});

export { test, expect };
