import {
  test as mswBase,
  expect,
  http,
  HttpResponse,
  passthrough,
} from "next/experimental/testmode/playwright/msw";
import { runWithAutoCoverage } from "../__helpers__/auto-coverage-fixture";

const test = mswBase.extend<{ autoTestCoverage: void }>({
  autoTestCoverage: [
    async ({ page }, use, testInfo) => {
      await runWithAutoCoverage(page, testInfo, use);
    },
    { scope: "test", auto: true },
  ],
});

export { test, expect, http, HttpResponse, passthrough };
