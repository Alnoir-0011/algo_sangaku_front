import type { Page } from "@playwright/test";
import { toBetterAuthSession, type TestSession } from "./session";

// コンポーネントテスト用。クライアントの useSession が叩く get-session の応答を差し替える。
// E2E 用のログイン（signin.ts）とは別のファイルにする。あちらは、認証のインスタンスを作るため、
// コンポーネントテストの Node 側が読み込むと、シークレットの確認などが不要に走る
export const mockClientSession = async (
  page: Page,
  session: TestSession | null,
) => {
  await page.route("**/api/auth/get-session", async (route) => {
    await route.fulfill({ json: toBetterAuthSession(session) });
  });
};
