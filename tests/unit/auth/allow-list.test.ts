import { describe, test, expect, vi, beforeEach } from "vitest";

// beforeEach では設定しない。auth.ts は import の時点で、環境変数から設定を作るため
vi.hoisted(() => {
  process.env.BETTER_AUTH_SECRET = "test-secret-for-allow-list-0123456789012";
  process.env.BETTER_AUTH_URL = "http://localhost:4020";
  process.env.AUTH_GOOGLE_ID = "google-client-id";
  process.env.AUTH_GOOGLE_SECRET = "google-client-secret";
  process.env.API_URL = "http://api.test";
});

const { revokeRailsApiKeyMock, serverFetchMock } = vi.hoisted(() => ({
  revokeRailsApiKeyMock: vi.fn(),
  serverFetchMock: vi.fn(),
}));

vi.mock("@/app/lib/server-fetch", () => ({ serverFetch: serverFetchMock }));
vi.mock("@/app/lib/rails-api-key", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/app/lib/rails-api-key")>()),
  revokeRailsApiKey: revokeRailsApiKeyMock,
}));
vi.mock("@/app/lib/set-flash", () => ({ setFlash: vi.fn() }));

import { auth } from "@/auth";
import {
  createAuthKit,
  mergeCookies,
  ORIGIN,
} from "@/tests/unit/auth/support";

const { signIn, post, get } = createAuthKit(auth, serverFetchMock);

beforeEach(() => {
  revokeRailsApiKeyMock.mockReset();
});

const NOT_FOUND = { message: "Not found" };

// ブラウザ向けの認証 API
describe("auth API for the browser", () => {
  // 認証 API が動いていることを確認できる
  test("should allow me to check that the auth API is running", async () => {
    expect((await get("/ok")).status).toBe(200);
  });

  // 自分のセッションを確認できる
  test("should allow me to check my session", async () => {
    expect((await get("/get-session")).status).toBe(200);
  });

  // サインアウトできる
  test("should allow me to sign out", async () => {
    expect((await post("/sign-out", {})).status).toBe(200);
  });

  // エラーページからサインインページへ遷移できる
  test("should allow me to be sent to the sign-in page from the error page", async () => {
    const response = await get("/error?error=access_denied");

    expect(response.status).toBe(302);
    expect(new URL(response.headers.get("location")!, ORIGIN).pathname).toBe(
      "/signin",
    );
  });

  // /sign-in/email と /sign-up/email は、emailAndPassword を有効にしていなくても、
  // Better Auth のルーターは 400 を返す。404 はこの許可リストからだけ返る
  // %s を呼び出せない
  test.each([
    ["/update-user", { name: "x" }],
    ["/update-session", {}],
    ["/delete-user", {}],
    ["/change-email", { newEmail: "a@example.com" }],
    ["/revoke-sessions", {}],
    ["/link-social", { provider: "google" }],
    ["/sign-in/email", { email: "a@example.com", password: "password" }],
    [
      "/sign-up/email",
      { email: "a@example.com", password: "password", name: "a" },
    ],
  ])("should not allow me to call %s", async (path, body) => {
    const response = await post(path, body);

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject(NOT_FOUND);
  });

  // %s を読み取れない
  test.each(["/list-sessions", "/list-accounts", "/account-info"])(
    "should not allow me to read %s",
    async (path) => {
      const response = await get(path);

      expect(response.status).toBe(404);
      expect(await response.json()).toMatchObject(NOT_FOUND);
    },
  );

  // OAuth の state を飛ばして ID トークンだけでサインインできる経路と、サーバーだけが
  // 開始できるサインインの経路は、どちらもブラウザからは閉じる
  // %s でブラウザからサインインを開始できない
  test.each([
    ["with an ID token that skips the OAuth state", { idToken: { token: "x" } }],
    ["without an ID token", { callbackURL: "/" }],
  ])("should not allow me to start sign-in from the browser %s", async (_label, extra) => {
    const response = await post("/sign-in/social", {
      provider: "google",
      ...extra,
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject(NOT_FOUND);
  });
});

// サーバー向けの認証 API
describe("auth API for the server", () => {
  // PKCE と state を使って、Google でのサインインを開始できる
  test("should allow me to start sign-in with Google using PKCE and a state", async () => {
    const { url } = await auth.api.signInSocial({
      body: { provider: "google", callbackURL: "/", disableRedirect: true },
    });

    const params = new URL(url!).searchParams;
    expect(new URL(url!).host).toBe("accounts.google.com");
    expect(params.get("code_challenge_method")).toBe("S256");
    expect(params.get("code_challenge")).toMatch(/^[\w-]{43}$/);
    expect(params.get("state")).toMatch(/^[\w-]{16,}$/);
  });

  // サーバーからでも、許可リストにないエンドポイントを呼び出せない
  test("should not allow me to call an endpoint that is not listed even from the server", async () => {
    await expect(
      auth.api.changeEmail({ body: { newEmail: "a@example.com" } }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  // アクセストークンを失わずに、ニックネームを更新できる
  test("should allow me to update my nickname without losing my access token", async () => {
    const { cookie } = await signIn("my-token");

    const response = await auth.api.updateUser({
      body: { nickname: "new nick" },
      headers: new Headers({ cookie }),
      asResponse: true,
    });
    const session = await auth.api.getSession({
      headers: new Headers({ cookie: mergeCookies(cookie, response) }),
    });

    expect(session?.user).toMatchObject({ nickname: "new nick" });
    expect(session?.session).toMatchObject({ railsAccessToken: "my-token" });
  });
});

// Cookie キャッシュを飛ばすクエリ
describe("queries that skip the cookie cache", () => {
  // %s %s を送れない
  test.each([
    ["GET", "/get-session?disableCookieCache=true"],
    ["GET", "/get-session?disableRefresh=true"],
    ["GET", "/callback/google?error=access_denied&disableCookieCache=true"],
    ["POST", "/sign-out?disableCookieCache=true"],
    ["GET", "/ok?disableRefresh=true"],
  ])("should not allow me to send %s %s", async (method, path) => {
    const { cookie } = await signIn("my-token");

    const response = await auth.handler(
      new Request(`${ORIGIN}/api/auth${path}`, {
        method,
        headers: {
          cookie,
          origin: ORIGIN,
          ...(method === "POST" ? { "content-type": "application/json" } : {}),
        },
        ...(method === "POST" ? { body: "{}" } : {}),
      }),
    );

    expect(response.status).toBe(400);
    expect(response.headers.getSetCookie()).toEqual([]);
  });
});
