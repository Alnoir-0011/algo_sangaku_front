// import { defineConfig, devices } from "@playwright/test";
import { defineConfig, devices } from "next/experimental/testmode/playwright";
import dotenv from "dotenv";
import { GUARD_TEST_LIMIT } from "./tests/e2e/guard/test-limit";
import path from "path";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
dotenv.config({
  path: path.resolve(__dirname, ".env"),
});

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "tests/**/*.spec.ts",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* CI では matrix 分割で各ジョブが独立して実行されるため workers 制限は不要 */
  workers: undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ["line"],
    ["html"],
    [
      "monocart-reporter",
      {
        name: "Coverage Report (E2E)",
        outputFile: "./coverage-reports/e2e/index.html",
        coverage: {
          outputDir: "./coverage-reports/e2e/v8",
          reports: ["v8", "console-summary", "raw", "json-summary"],
          // monocart の entryFilter/sourceFilter はオブジェクトキーの定義順で
          // 先勝ち判定（最初にマッチしたキーの値が採用される）。順序を変えないこと。
          // E2E は Next.js のページ全体（ページ本体・外部スクリプト等）が対象に
          // 含まれるため、_next/static/ のみを許可するホワイトリスト方式にしている
          entryFilter: {
            "_next/static/": true,
            "**": false,
          },
          sourceFilter: {
            "node_modules": false,
            "tests": false,
            "app/": true,
            "theme.ts": true,
          },
        },
      },
    ],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */

  // webServer は配列でも順次起動される（並列ではない）。
  // 1 本目のビルドが終わってから 2 本目が立ち上がるため、.next を共有できる
  webServer: [
    {
      // CI では build ジョブで生成した .next を artifact 経由で受け取り start のみ実行する
      // ローカルでは毎回クリーンビルドしてから起動する
      command: process.env.CI
        ? "pnpm run start -p 4020"
        : "rm -rf .next && pnpm run build && pnpm run start -p 4020",
      url: "http://localhost:4020",
      reuseExistingServer: false,
      // ローカルビルド時に Google Maps をモックへ差し替え、ソースマップを有効化する（CI は build ジョブ側で設定）
      env: {
        E2E_MOCK_MAPS: "true",
        COVERAGE: "true",
        APP_ENV: "test",
        // 既存の E2E に影響を出さないため、通常のサーバーでは観測のみ行う
        GUARD_MODE: "shadow",
        // 本番のしきい値で超過させると CI が終わらないため引き下げる
        GUARD_TEST_LIMIT: String(GUARD_TEST_LIMIT),
        // x-guard-* は誰にでも返すと回避手法の総当たりに使われるため、
        // このトークンを提示したリクエストにだけ返す
        GUARD_DEBUG_TOKEN: "e2e-guard-debug",
      },
    },
    {
      // ガードの遮断挙動（403 / 429）を検証するための専用サーバー。
      // 1 本目と同じ .next を使うため再ビルドは発生しない
      command: "pnpm run start -p 4021",
      url: "http://localhost:4021",
      reuseExistingServer: false,
      env: {
        E2E_MOCK_MAPS: "true",
        COVERAGE: "true",
        APP_ENV: "test",
        GUARD_MODE: "enforce",
        GUARD_TEST_LIMIT: String(GUARD_TEST_LIMIT),
      },
    },
  ],
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: 'http://127.0.0.1:3000',
    baseURL: "http://localhost:4020",

    /* Collect trace on failure (failure 数が減った後のフレーク調査を容易にする) */
    trace: "retain-on-failure",
  },

  /* Configure projects for major browsers */
  projects: [
    // ガードの遮断挙動を検証する専用 project。
    // インメモリのカウンタはプロセス内で共有されるため、直列実行のうえ
    // テストごとに x-forwarded-for で別 IP を名乗ってカウンタを分離する
    {
      name: "guard-enforce",
      use: { ...devices["Desktop Chrome"], baseURL: "http://localhost:4021" },
      testMatch: /guard\/enforce\.spec\.ts/,
      fullyParallel: false,
      workers: 1,
    },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /guard\/enforce\.spec\.ts/,
    },

    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
      testIgnore: /guard\/enforce\.spec\.ts/,
    },

    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
      testIgnore: /guard\/enforce\.spec\.ts/,
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
