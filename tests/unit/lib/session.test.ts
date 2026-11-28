import { describe, test, expect, vi, beforeEach } from "vitest";

const {
  getSessionApiMock,
  signOutApiMock,
  updateUserApiMock,
  redirectMock,
  headersMock,
} = vi.hoisted(() => ({
  getSessionApiMock: vi.fn(),
  signOutApiMock: vi.fn(),
  updateUserApiMock: vi.fn(),
  redirectMock: vi.fn(),
  headersMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  SKIP_API_KEY_REVOCATION_HEADER: "x-skip-api-key-revocation",
  auth: {
    api: {
      getSession: getSessionApiMock,
      signOut: signOutApiMock,
      updateUser: updateUserApiMock,
    },
  },
}));
vi.mock("next/headers", () => ({ headers: headersMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));

import {
  getSession,
  signOutAndRedirect,
  updateSessionNickname,
} from "@/app/lib/session";

const SKIP_API_KEY_REVOCATION_HEADER = "x-skip-api-key-revocation";

// RSC の headers() が返す ReadonlyHeaders の再現。Headers と違い、entries() はあるが、
// Symbol.iterator も、自前の列挙できるプロパティも無い。new Headers(これ) は空になる。
// 素の Headers を返すモックだと、この違いを検出できない
class ReadonlyHeadersLike {
  #entries: [string, string][];

  constructor(init: Record<string, string> = {}) {
    this.#entries = Object.entries(init);
  }

  entries() {
    return this.#entries[Symbol.iterator]();
  }
}

const baSession = {
  session: { id: "s1", railsAccessToken: "token" },
  user: {
    id: "u1",
    email: "me@example.com",
    name: "Me",
    nickname: "nick",
    role: "admin",
  },
};

// getSession（セッションの取得）
describe("getSession", () => {
  beforeEach(() => {
    getSessionApiMock.mockReset().mockResolvedValue(baSession);
    headersMock.mockReset().mockResolvedValue(
      new ReadonlyHeadersLike({ cookie: "better-auth.session_token=abc" }),
    );
  });

  // ユーザー・ロール・アクセストークンを取得できる
  test("should allow me to get my user, role and access token", async () => {
    const session = await getSession();

    expect(session).toEqual({
      user: { id: "u1", email: "me@example.com", name: "Me", nickname: "nick" },
      role: "admin",
      accessToken: "token",
    });
  });

  // 認証ライブラリのセッションがなければ、サインイン状態にならない
  test("should not allow me to be signed in without a session of the auth library", async () => {
    getSessionApiMock.mockResolvedValue(null);

    expect(await getSession()).toBeNull();
  });

  // セッションにバックエンド用のアクセストークンがなければ、サインイン状態にならない
  test("should not allow me to be signed in when my session has no access token for the backend", async () => {
    getSessionApiMock.mockResolvedValue({
      ...baSession,
      session: { id: "s1" },
    });

    expect(await getSession()).toBeNull();
  });

  // フレームワークが渡した cookie から、サインイン状態を認識できる
  test("should allow me to be recognized from the cookies that the framework gave", async () => {
    await getSession();

    const { headers } = getSessionApiMock.mock.calls[0][0];
    expect(headers).toBeInstanceOf(Headers);
    expect(headers.get("cookie")).toBe("better-auth.session_token=abc");
  });
});

// updateSessionNickname（セッションのニックネーム更新）
describe("updateSessionNickname", () => {
  beforeEach(() => {
    updateUserApiMock.mockReset();
    headersMock.mockReset().mockResolvedValue(
      new ReadonlyHeadersLike({ cookie: "better-auth.session_token=abc" }),
    );
  });

  // セッションのニックネームを更新できる
  test("should allow me to update my nickname in my session", async () => {
    await updateSessionNickname("new nick");

    expect(updateUserApiMock).toHaveBeenCalledTimes(1);
    const { body, headers } = updateUserApiMock.mock.calls[0][0];
    expect(body).toEqual({ nickname: "new nick" });
    expect(headers.get("cookie")).toBe("better-auth.session_token=abc");
  });

  // 握ると、呼び出し元（プロフィールの更新）が、失敗を判断できない
  // セッションのニックネーム更新の失敗を、呼び出し元から隠さない
  test("should not allow my failure to update my nickname in my session to be hidden from the caller", async () => {
    updateUserApiMock.mockRejectedValue(new Error("cookie is broken"));

    await expect(updateSessionNickname("new nick")).rejects.toThrow(
      "cookie is broken",
    );
  });
});

// signOutAndRedirect（サインアウトとリダイレクト）
describe("signOutAndRedirect", () => {
  beforeEach(() => {
    signOutApiMock.mockReset();
    redirectMock.mockReset().mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
    headersMock.mockReset().mockResolvedValue(new ReadonlyHeadersLike());
  });

  // サインアウトして、指定したページへ遷移する
  test("should allow me to be signed out and sent to the given page", async () => {
    await expect(signOutAndRedirect("/signin")).rejects.toThrow("NEXT_REDIRECT");

    expect(signOutApiMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledWith("/signin");
  });

  // サインアウト時、デフォルトで API キーを削除する
  test("should allow my API key to be deleted by default when I sign out", async () => {
    await expect(signOutAndRedirect("/signin")).rejects.toThrow("NEXT_REDIRECT");

    const { headers } = signOutApiMock.mock.calls[0][0];
    expect(headers.get(SKIP_API_KEY_REVOCATION_HEADER)).toBeNull();
  });

  // すでに期限切れのとき、バックエンドに API キーの削除を依頼しない
  test("should not ask the backend to delete my API key when it has already expired", async () => {
    await expect(
      signOutAndRedirect("/signin", { revokeApiKey: false }),
    ).rejects.toThrow("NEXT_REDIRECT");

    const { headers } = signOutApiMock.mock.calls[0][0];
    expect(headers.get(SKIP_API_KEY_REVOCATION_HEADER)).toBe("1");
  });

  // サインアウトする前に、別のページへ遷移させない
  test("should not allow me to be sent away before I am signed out", async () => {
    await expect(signOutAndRedirect("/signin")).rejects.toThrow("NEXT_REDIRECT");

    expect(signOutApiMock.mock.invocationCallOrder[0]).toBeLessThan(
      redirectMock.mock.invocationCallOrder[0],
    );
  });
});
