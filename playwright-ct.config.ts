import { defineConfig, devices } from "@playwright/experimental-ct-react";
import path from "path";
import dotenv from "dotenv";
/**
 * See https://playwright.dev/docs/test-configuration.
 */

dotenv.config({
  path: path.resolve(__dirname, ".env"),
});

export default defineConfig({
  testDir: "./tests/components",
  /* The base directory, relative to the config file, for snapshot files created with toMatchSnapshot and toHaveScreenshot. */
  snapshotDir: "./__snapshots__",
  /* Maximum time one test can run for. */
  timeout: 10 * 1000,
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",

    /* Port to use for Playwright component endpoint. */
    ctPort: 3100,

    ctViteConfig: {
      resolve: {
        alias: [
          {
            find: "next/navigation",
            replacement: path.join(
              __dirname,
              "./tests/__mocks__/navigation.ts",
            ),
          },
          {
            find: "@monaco-editor/react",
            replacement: path.join(
              __dirname,
              "./tests/__mocks__/monaco-editor.tsx",
            ),
          },
          {
            find: "@/app/lib/actions/auth",
            replacement: path.join(
              __dirname,
              "./tests/__mocks__/actions/auth.ts",
            ),
          },
          {
            find: "@/app/lib/actions/sangaku",
            replacement: path.join(
              __dirname,
              "./tests/__mocks__/actions/sangaku.ts",
            ),
          },
          {
            find: "@/app/lib/actions/shrine",
            replacement: path.join(
              __dirname,
              "./tests/__mocks__/actions/shrine.ts",
            ),
          },
          {
            find: "@/app/lib/actions/profile",
            replacement: path.join(
              __dirname,
              "./tests/__mocks__/actions/profile.ts",
            ),
          },
          {
            find: "@/app/lib/actions/flash",
            replacement: path.join(
              __dirname,
              "./tests/__mocks__/actions/flash.ts",
            ),
          },
          {
            find: "@/app/lib/data/answer",
            replacement: path.join(
              __dirname,
              "./tests/__mocks__/data/answer.ts",
            ),
          },
          {
            find: "@/app/lib/data/shrine",
            replacement: path.join(
              __dirname,
              "./tests/__mocks__/data/shrine.ts",
            ),
          },
          {
            find: "@/app/lib/data/sangaku",
            replacement: path.join(
              __dirname,
              "./tests/__mocks__/data/sangaku.ts",
            ),
          },
          {
            find: "@/",
            replacement: path.join(__dirname, "./"),
          },
        ],
      },
    },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
});
