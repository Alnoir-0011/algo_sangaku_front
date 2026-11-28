import { Page, expect, test } from "@playwright/test";
import { createSessionCookies } from "./test-auth";

// Better Auth には、Auth.js のような既定のサインインページが無い。フォームを自前で作ると、
// 本番のコードに、テスト用のサインインの入口が残る。そのため、フォームを通らず、
// テスト側で作った cookie をブラウザへ渡す（tests/__helpers__/test-auth.ts）

// 鍵・cookie の名前・baseURL がサーバーと食い違うと、サーバーは cookie を拒み、未ログインのまま
// テストが続く。「トークンが出ない」「再発行されない」といったテストは、未ログインでも通るため、
// 誤った安心を生む。サーバーがログインを認めたことを、ここで確かめる。
// 全テストで確かめると、get-session のレート制限（同じ IP から 10 秒に 300 件。E2E は 3 つの
// ブラウザが同じ IP から並列に動く）に当たり、429 で落ちる。食い違いは、全テストで同じように
// 起きるので、ワーカーごと・役割ごとの最初の 1 回で足りる
const verifiedRoles = new Set<string>();

const signInWithCookies = async (
  page: Page,
  email: string,
  role: "general" | "admin",
) => {
  await page.context().addCookies(await createSessionCookies({ email, role }));
  await page.goto("/");
  if (verifiedRoles.has(role)) return;

  const response = await page.request.get("/api/auth/get-session");
  const body = await response.text();
  const signedInEmail = (() => {
    try {
      return JSON.parse(body)?.user?.email as string | undefined;
    } catch {
      return undefined;
    }
  })();
  expect(
    signedInEmail?.toLowerCase(),
    `サーバーが、テスト用の cookie を認めなかった（status ${response.status()}、本文の先頭: ${body.slice(0, 80)}）。鍵と BETTER_AUTH_URL を、サーバーとテストで同じにする（playwright.config.ts）`,
  ).toBe(email.toLowerCase());
  verifiedRoles.add(role);
};

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
  await signInWithCookies(page, email, "general");
};

export const setAdminSession = async (page: Page) => {
  await signInWithCookies(page, "admin_user@example.com", "admin");
};
