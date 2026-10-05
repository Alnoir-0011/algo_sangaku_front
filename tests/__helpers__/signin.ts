import { Page, test } from "@playwright/test";
import type { Session } from "next-auth";

/**
 * テストごとに一意のメールアドレスでログインする。
 *
 * runSource のレート制限（ユーザー単位・5回/分）は固定の test_user@example.com
 * のままだと全 E2E テストで同じキーを共有してしまい、「確認画面へ」から
 * CheckPage を開くテストが積み重なると無関係なテストまで巻き込んで失敗する。
 * test.info().testId でテストごとに異なるメールにし、実クライアントの
 * ユーザー単位カウントを再現する。
 */
export const setSession = async (
  page: Page,
  email = `${test.info().testId}@example.com`,
) => {
  await page.goto("/");
  await page.getByRole("button", { name: "サインイン" }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password");
  await page.getByRole("button", { name: "Sign in with Credentials" }).click();
  await page.waitForURL("/", { timeout: 15_000 });
};

export const setAdminSession = async (page: Page) => {
  await page.goto("/");
  await page.getByRole("button", { name: "サインイン" }).click();
  await page.getByLabel("Email").fill("admin_user@example.com");
  await page.getByLabel("Password").fill("password");
  await page.getByRole("button", { name: "Sign in with Credentials" }).click();
  await page.waitForURL("/", { timeout: 15_000 });
};

// Note: コンポーネントテスト用
export const mockClientSession = async (page: Page, json: Session | null) => {
  await page.route("http://localhost:3100/api/auth/session", async (route) => {
    await route.fulfill({ json });
  });
};
