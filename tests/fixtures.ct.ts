import {
  test as ctBase,
  expect,
} from "@playwright/experimental-ct-react";
import { runWithAutoCoverage } from "./__helpers__/auto-coverage-fixture";
import { mockClientSession } from "./__helpers__/client-session";
import type { TestSession } from "./__helpers__/session";

const test = ctBase.extend<{ autoTestCoverage: void }>({
  autoTestCoverage: [
    async ({ page }, use, testInfo) => {
      await runWithAutoCoverage(page, testInfo, use);
    },
    { scope: "test", auto: true },
  ],
  // Better Auth の useSession は、Provider に渡す値ではなく、サーバーの get-session を読む。
  // 各テストで差し替えると、書き方が散らばるため、hooksConfig.session を、フィクスチャが
  // マウント前に、get-session の応答として、一括して差し替える
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
