import type { Page } from "@playwright/test";

/**
 * リクエストの開始・完了が quietMs の間なくなるまで待つ。maxMs で打ち切る。
 *
 * waitForLoadState("networkidle") を使わないのは、通信が続くと到達せず、
 * テスト全体のタイムアウトまで待ってしまうため（ローカルで 24 回に 1 回起きた）。
 * 打ち切っても失敗にしないので、待てなかった分の不安定さは残る。
 */
export async function waitForQuietRequests(
  page: Page,
  { quietMs = 500, maxMs = 5_000 }: { quietMs?: number; maxMs?: number } = {},
) {
  let lastActivity = Date.now();
  const markActivity = () => {
    lastActivity = Date.now();
  };
  page.on("request", markActivity);
  page.on("requestfinished", markActivity);
  page.on("requestfailed", markActivity);
  try {
    const deadline = Date.now() + maxMs;
    while (Date.now() < deadline && Date.now() - lastActivity < quietMs) {
      await page.waitForTimeout(100);
    }
  } finally {
    page.off("request", markActivity);
    page.off("requestfinished", markActivity);
    page.off("requestfailed", markActivity);
  }
}
