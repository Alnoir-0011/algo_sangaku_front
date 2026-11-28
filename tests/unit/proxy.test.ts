import { describe, test, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getSessionApiMock, setFlashMock, runGuardMock } = vi.hoisted(() => ({
  getSessionApiMock: vi.fn(),
  setFlashMock: vi.fn(),
  runGuardMock: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: { api: { getSession: getSessionApiMock } } }));
vi.mock("@/app/lib/set-flash", () => ({ setFlash: setFlashMock }));
vi.mock("@/app/lib/guard", () => ({
  runGuard: runGuardMock,
  resolveGuardMode: vi.fn().mockReturnValue("off"),
  getDefaultLimiter: vi.fn(),
}));

import proxy from "@/proxy";

const ORIGIN = "http://localhost:4020";

const run = (path: string) => proxy(new NextRequest(`${ORIGIN}${path}`));

const signedInAs = (email: string, role: "general" | "admin" = "general") => {
  getSessionApiMock.mockResolvedValue({
    session: { railsAccessToken: "token" },
    user: { email, nickname: "nick", role },
  });
};

const redirectedTo = (response: Response | undefined) =>
  response?.status === 307 ? new URL(response.headers.get("location")!).pathname : null;

// proxy（プロキシ）
describe("proxy", () => {
  beforeEach(() => {
    getSessionApiMock.mockReset().mockResolvedValue(null);
    setFlashMock.mockReset();
    runGuardMock.mockReset().mockResolvedValue({ action: "allow" });
  });

  // サインアウト状態のとき
  describe("when I am signed out", () => {
    // サインインが必要なページを開けない
    test("should not allow me to open a page that needs sign-in", async () => {
      expect(redirectedTo(await run("/user/profile"))).toBe("/signin");
    });

    // サインインページへ遷移したとき、サインインを促す通知が見える
    test("should allow me to see the sign-in notice when I am sent to the sign-in page", async () => {
      await run("/user/profile");

      expect(setFlashMock).toHaveBeenCalledWith({
        type: "warning",
        message: "サインインしてください",
      });
    });

    // 公開ページを開ける
    test("should allow me to open a public page", async () => {
      expect(await run("/shrines")).toBeUndefined();
    });

    // サインインページを開ける
    test("should allow me to open the sign-in page", async () => {
      expect(await run("/signin")).toBeUndefined();
    });

    // 管理画面を開けない
    test("should not allow me to open the admin page", async () => {
      expect(redirectedTo(await run("/admin"))).toBe("/signin");
    });

    // リダイレクトされずに認証 API にリクエストできる
    test("should allow me to request the auth API without being redirected", async () => {
      expect(await run("/api/auth/get-session")).toBeUndefined();
      expect(setFlashMock).not.toHaveBeenCalled();
    });

    // サインインせずに、認証 API のパスで始まるだけのルートを開けない
    test("should not allow me to open a route that only starts with the path of the auth API without signing in", async () => {
      expect(redirectedTo(await run("/api/authors"))).toBe("/signin");
    });
  });

  // レート制限に自分が誰かが伝わるとき
  describe("when the rate limit is told who I am", () => {
    const emailPassedToGuard = async (path: string) => {
      await run(path);
      return runGuardMock.mock.calls[0][1].email;
    };

    // サインイン中は、レート制限にメールアドレスが使われる
    test("should allow my email to be used for the rate limit when I am signed in", async () => {
      signedInAs("me@example.com");

      expect(await emailPassedToGuard("/shrines")).toBe("me@example.com");
    });

    // サインアウト中は、レート制限にメールアドレスが使われない
    test("should not allow an email to be used for the rate limit when I am signed out", async () => {
      expect(await emailPassedToGuard("/shrines")).toBeNull();
    });
  });

  // 認証ライブラリのセッションを読み取れないとき
  describe("when the session of the auth library cannot be read", () => {
    beforeEach(() => {
      getSessionApiMock.mockRejectedValue(new Error("boom"));
      vi.spyOn(console, "error").mockImplementation(() => {});
    });

    // 公開ページを開ける
    test("should allow me to open a public page", async () => {
      expect(await run("/shrines")).toBeUndefined();
    });

    // サインインページを開ける
    test("should allow me to open the sign-in page", async () => {
      expect(await run("/signin")).toBeUndefined();
    });

    // サインインが必要なページを開けない
    test("should not allow me to open a page that needs sign-in", async () => {
      expect(redirectedTo(await run("/user/profile"))).toBe("/signin");
    });

    // レート制限を省略できない
    test("should not allow the rate limit to be skipped", async () => {
      await run("/shrines");

      expect(runGuardMock).toHaveBeenCalledTimes(1);
      expect(runGuardMock.mock.calls[0][1].email).toBeNull();
    });
  });

  // サインイン状態のとき
  describe("when I am signed in", () => {
    // サインインが必要なページを開ける
    test("should allow me to open a page that needs sign-in", async () => {
      signedInAs("me@example.com");

      expect(await run("/user/profile")).toBeUndefined();
    });

    // サインインページを開けない
    test("should not allow me to open the sign-in page", async () => {
      signedInAs("me@example.com");

      expect(redirectedTo(await run("/signin"))).toBe("/");
    });

    // 一般ユーザーは管理画面を開けない
    test("should not allow a general user to open the admin page", async () => {
      signedInAs("me@example.com", "general");

      expect(redirectedTo(await run("/admin"))).toBe("/");
    });

    // 管理者は管理画面を開ける
    test("should allow an admin to open the admin page", async () => {
      signedInAs("me@example.com", "admin");

      expect(await run("/admin")).toBeUndefined();
    });
  });

  // セッションにバックエンド用のアクセストークンがないとき
  describe("when my session has no access token for the backend", () => {
    // サインインが必要なページを開けない
    test("should not allow me to open a page that needs sign-in", async () => {
      getSessionApiMock.mockResolvedValue({ user: { email: "me@example.com" } });

      expect(redirectedTo(await run("/user/profile"))).toBe("/signin");
    });

    // ロールが admin でも、管理画面を開けない
    test("should not allow me to open the admin page even if my role says admin", async () => {
      getSessionApiMock.mockResolvedValue({
        session: {},
        user: { email: "me@example.com", nickname: "nick", role: "admin" },
      });

      expect(redirectedTo(await run("/admin"))).toBe("/signin");
    });
  });
});
