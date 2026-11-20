import {
  test as ctBase,
  expect,
} from "@playwright/experimental-ct-react";
import { runWithAutoCoverage } from "./__helpers__/auto-coverage-fixture";
import { mockClientSession } from "./__helpers__/signin";
import type { TestSession } from "./__helpers__/session";

const test = ctBase.extend<{ autoTestCoverage: void }>({
  autoTestCoverage: [
    async ({ page }, use, testInfo) => {
      await runWithAutoCoverage(page, testInfo, use);
    },
    { scope: "test", auto: true },
  ],
  // hooksConfig.session を、マウント前に get-session の応答として差し替える。
  // 以前は SessionProvider に渡していたが、Better Auth の useSession は Provider を使わず、
  // サーバーへ取りに行く。各テストを変えずに、同じ書き方（hooksConfig.session）を保つため、
  // フィクスチャで一括して差し替える
  mount: async ({ mount, page }, use) => {
    const mountWithSession = (async (component, options) => {
      const { session } = (
        options as { hooksConfig?: { session?: TestSession | null } } | undefined
      )?.hooksConfig ?? {};
      await mockClientSession(page, session ?? null);
      // mount は、story ID と、React 要素の 2 つのオーバーロードを持つため、まとめて渡す
      return (mount as (c: unknown, o: unknown) => Promise<unknown>)(
        component,
        options,
      );
    }) as typeof mount;
    await use(mountWithSession);
  },
});

export { test, expect };
