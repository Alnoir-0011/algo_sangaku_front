import { test as e2eBase, expect } from "@playwright/test";
import { runWithAutoCoverage } from "../__helpers__/auto-coverage-fixture";

const test = e2eBase.extend<{ autoTestCoverage: void }>({
  autoTestCoverage: [
    async ({ page }, use, testInfo) => {
      await runWithAutoCoverage(page, testInfo, use);
    },
    { scope: "test", auto: true },
  ],
});

export { test, expect };
