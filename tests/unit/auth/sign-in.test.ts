import { describe, test, expect, vi, beforeEach } from "vitest";

// beforeEach では設定しない。auth.ts は import の時点で、環境変数から設定を作るため
vi.hoisted(() => {
  process.env.BETTER_AUTH_SECRET = "test-secret-for-sign-in-0123456789012345";
  process.env.BETTER_AUTH_URL = "http://localhost:4020";
  process.env.AUTH_GOOGLE_ID = "google-client-id";
  process.env.AUTH_GOOGLE_SECRET = "google-client-secret";
  process.env.API_URL = "http://api.test";
});

const { revokeRailsApiKeyMock, serverFetchMock, setFlashMock } = vi.hoisted(
  () => ({
    revokeRailsApiKeyMock: vi.fn(),
    serverFetchMock: vi.fn(),
    setFlashMock: vi.fn(),
  }),
);

vi.mock("@/app/lib/server-fetch", () => ({ serverFetch: serverFetchMock }));
vi.mock("@/app/lib/rails-api-key", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/app/lib/rails-api-key")>()),
  revokeRailsApiKey: revokeRailsApiKeyMock,
}));
vi.mock("@/app/lib/set-flash", () => ({ setFlash: setFlashMock }));

import { auth } from "@/auth";
import {
  createAuthKit,
  mergeCookies,
  ORIGIN,
} from "@/tests/unit/auth/support";

const { signIn, attemptSignIn, get } = createAuthKit(auth, serverFetchMock);

beforeEach(() => {
  revokeRailsApiKeyMock.mockReset();
  setFlashMock.mockReset();
});

const sessionOf = (cookie: string, instance = auth) =>
  instance.api.getSession({ headers: new Headers({ cookie }) });

const tokenOf = async (cookie: string, instance = auth) =>
  (
    (await sessionOf(cookie, instance))?.session as {
      railsAccessToken?: string;
    }
  ).railsAccessToken;

// 再サインイン
describe("signing in again", () => {
  // 再サインインすると、API キーを置き換えられる
  test("should allow me to replace my API key when I sign in again", async () => {
    const first = await signIn("first-token");

    await signIn("second-token", { cookie: first.cookie });

    expect(revokeRailsApiKeyMock).toHaveBeenCalledTimes(1);
    expect(revokeRailsApiKeyMock).toHaveBeenCalledWith("first-token");
  });

  // 新しいセッションが、新しい API キーを持つ
  test("should allow my new session to carry the new API key", async () => {
    const first = await signIn("first-token");

    const second = await signIn("second-token", { cookie: first.cookie });

    expect(await tokenOf(second.cookie)).toBe("second-token");
  });

  // 持っていない API キーを失うことがない
  test("should not allow me to lose an API key I never had", async () => {
    await signIn("first-token");

    expect(revokeRailsApiKeyMock).not.toHaveBeenCalled();
  });

  // GET で踏ませるだけで、サインイン中の利用者の ApiKey を失効させられてはならない
  // サインインに至らなかったコールバックが、API キーを削除しない
  test("should not allow a callback that did not sign me in to delete my API key", async () => {
    const { cookie } = await signIn("my-token");

    const response = await get("/callback/google?error=access_denied", cookie);

    expect(response.status).toBe(302);
    expect(revokeRailsApiKeyMock).not.toHaveBeenCalled();
    expect(await tokenOf(cookie)).toBe("my-token");
  });
});

// 同じ利用者の別の端末のサインインで、自分の端末のトークンが変わってはならない
// 複数のデバイスでのサインイン
describe("signing in on more than one device", () => {
  // デバイスごとのアクセストークンを保持できる
  test("should allow me to keep the access token of each device", async () => {
    const pc = await signIn("token-of-pc");
    const phone = await signIn("token-of-phone");

    expect(await tokenOf(pc.cookie)).toBe("token-of-pc");
    expect(await tokenOf(phone.cookie)).toBe("token-of-phone");
  });

  // 別のデバイスでサインインしたあとにニックネームを更新しても、アクセストークンを保持できる
  test("should allow me to keep my access token when I update my nickname after signing in on another device", async () => {
    const pc = await signIn("token-of-pc");
    await signIn("token-of-phone");

    const response = await auth.api.updateUser({
      body: { nickname: "new nick" },
      headers: new Headers({ cookie: pc.cookie }),
      asResponse: true,
    });
    const cookie = mergeCookies(pc.cookie, response);

    expect(await tokenOf(cookie)).toBe("token-of-pc");
    expect((await sessionOf(cookie))?.user).toMatchObject({
      nickname: "new nick",
    });
  });

  // セッション Cookie がサーバーから再構築されても、アクセストークンを保持できる
  test("should allow me to keep my access token when my session cookie is rebuilt from the server", async () => {
    const pc = await signIn("token-of-pc");
    await signIn("token-of-phone");

    const response = await auth.api.getSession({
      headers: new Headers({ cookie: pc.cookie }),
      query: { disableCookieCache: true },
      asResponse: true,
    });

    expect(await tokenOf(mergeCookies(pc.cookie, response))).toBe(
      "token-of-pc",
    );
  });

  // 自分のセッションを一度も見ていないサーバーでも、Cookie でサインインしたままでいられる
  test("should allow me to stay signed in with my cookie on a server that has never seen my session", async () => {
    const { cookie } = await signIn("token-of-pc");
    vi.resetModules();
    const { auth: freshAuth } = await import("@/auth");

    expect(await tokenOf(cookie, freshAuth)).toBe("token-of-pc");
  });
});

// サインインのメッセージ
describe("sign-in message", () => {
  // サインインできたら、サインインのメッセージが見える
  test("should allow me to see the sign-in message once I have signed in", async () => {
    await signIn("my-token");

    expect(setFlashMock).toHaveBeenCalledTimes(1);
    expect(setFlashMock).toHaveBeenCalledWith({
      type: "success",
      message: "サインインしました",
    });
  });

  // サインインに成功しなかったとき、サインインのメッセージが見えない
  test("should not allow me to see the sign-in message when the sign-in did not succeed", async () => {
    const response = await get("/callback/google?error=access_denied");

    expect(response.status).toBe(302);
    expect(setFlashMock).not.toHaveBeenCalled();
  });

  // getUserInfo は成功を返しても、Better Auth がこのあと、リンクの拒否で失敗しうる。
  // 同じメールの別の sub は、メールが未確認だと、既存の利用者にリンクされない
  // バックエンドに受け入れられたあとでサインインに失敗したとき、サインインのメッセージが見えない
  test("should not allow me to see the sign-in message when the sign-in failed after the backend accepted me", async () => {
    const identity = { email: "refused-link@example.com" };
    await signIn("first-token", { ...identity, sub: "sub-of-first" });
    setFlashMock.mockReset();
    serverFetchMock.mockClear();

    const { response } = await attemptSignIn("second-token", {
      ...identity,
      sub: "sub-of-second",
    });

    expect(serverFetchMock).toHaveBeenCalledTimes(1);
    expect(response.headers.get("location")).toContain("error=");
    expect(setFlashMock).not.toHaveBeenCalled();
  });
});

// サインインの失敗
describe("sign-in failure", () => {
  // サーバー側に存在しない state が渡されたとき、エラー付きでサインインページへ遷移する
  test("should allow me to be sent to the sign-in page with the error when the state is missing", async () => {
    const response = await get("/callback/google?code=code&state=unknown");

    const location = new URL(response.headers.get("location")!, ORIGIN);
    expect(location.pathname).toBe("/signin");
    expect(location.searchParams.get("error")).toBe("state_mismatch");
  });
});
