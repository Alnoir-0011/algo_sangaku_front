import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";

const {
  getSessionMock,
  setFlashMock,
  signOutAndRedirectMock,
  updateSessionNicknameMock,
  redirectMock,
  revalidatePathMock,
} = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  setFlashMock: vi.fn(),
  signOutAndRedirectMock: vi.fn(),
  updateSessionNicknameMock: vi.fn(),
  redirectMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("@/app/lib/session", () => ({
  getSession: getSessionMock,
  signOutAndRedirect: signOutAndRedirectMock,
  updateSessionNickname: updateSessionNicknameMock,
}));
vi.mock("@/app/lib/set-flash", () => ({ setFlash: setFlashMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("next/dist/client/components/redirect-error", () => ({
  isRedirectError: (error: unknown) =>
    error instanceof Error && error.message === "NEXT_REDIRECT",
}));

import {
  updateProfile,
  updateShowAnswerCount,
} from "@/app/lib/actions/profile";

const formOf = (nickname: string) => {
  const form = new FormData();
  form.set("nickname", nickname);
  return form;
};

const profileResponse = (nickname: string) =>
  new Response(JSON.stringify({ data: { attributes: { nickname } } }), {
    status: 200,
  });

// updateProfile（プロフィールの更新）
describe("updateProfile", () => {
  beforeEach(() => {
    getSessionMock.mockReset().mockResolvedValue({ accessToken: "token" });
    setFlashMock.mockReset();
    signOutAndRedirectMock.mockReset();
    updateSessionNicknameMock.mockReset();
    revalidatePathMock.mockReset();
    redirectMock.mockReset().mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(profileResponse("new")));
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // フォームの値と、バックエンドが受理した値を変えて、どちらが session に渡るかを確かめる
  // バックエンドが受理したニックネームが、セッションに反映される
  test("should allow me to see the nickname the backend accepted in my session", async () => {
    const fetchMock = vi.fn().mockResolvedValue(profileResponse("new"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      updateProfile({}, formOf(" new ")),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(fetchMock.mock.calls[0][1].body).toBe(
      JSON.stringify({ user: { nickname: " new " } }),
    );
    expect(updateSessionNicknameMock).toHaveBeenCalledWith("new");
    expect(setFlashMock).toHaveBeenCalledWith({
      type: "success",
      message: "プロフィールを更新しました",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/user/profile");
    expect(redirectMock).toHaveBeenCalledWith("/user/profile");
  });

  // Rails では更新済みなので、失敗として表示すると、再送信しても変わらない更新になる
  // セッションが更新に追従できなくても、プロフィールを更新したことが表示される
  test("should allow me to see that my profile was updated even when my session could not follow it", async () => {
    updateSessionNicknameMock.mockRejectedValue(new Error("cookie is broken"));

    await expect(
      updateProfile({}, formOf("new")),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(setFlashMock).toHaveBeenCalledWith({
      type: "success",
      message: "プロフィールを更新しました",
    });
    expect(setFlashMock).not.toHaveBeenCalledWith({
      type: "error",
      message: "予期せぬエラーが発生しました",
    });
  });

  // バックエンドが受理しなかったニックネームを、セッションに反映しない
  test("should not allow my session to take a nickname that the backend did not accept", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ errors: [] }), { status: 400 }),
      ),
    );

    const state = await updateProfile({}, formOf(""));

    expect(state).toMatchObject({ values: { nickname: "" } });
    expect(setFlashMock).toHaveBeenCalledWith({
      type: "error",
      message: "入力に誤りがあります",
    });
    expect(updateSessionNicknameMock).not.toHaveBeenCalled();
  });

  // API が 401 を返したとき、API キーを削除せずにサインアウトする
  test("should allow me to be signed out without deleting my API key when the API responds with 401", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
    );

    await updateProfile({}, formOf("new"));

    expect(signOutAndRedirectMock).toHaveBeenCalledWith("/signin", {
      revokeApiKey: false,
    });
  });
});

// updateShowAnswerCount（回答数表示の更新）
describe("updateShowAnswerCount", () => {
  beforeEach(() => {
    getSessionMock.mockReset().mockResolvedValue({ accessToken: "token" });
    setFlashMock.mockReset();
    signOutAndRedirectMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // 回答数を表示するかどうかを変更できる
  test("should allow me to change whether my answer count is shown", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    expect(await updateShowAnswerCount(false)).toEqual({ success: true });

    expect(fetchMock.mock.calls[0][1].body).toBe(
      JSON.stringify({ user: { show_answer_count: false } }),
    );
  });

  // API が 401 を返したとき、API キーを削除せずにサインアウトする
  test("should allow me to be signed out without deleting my API key when the API responds with 401", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
    );

    await updateShowAnswerCount(true);

    expect(signOutAndRedirectMock).toHaveBeenCalledWith("/signin", {
      revokeApiKey: false,
    });
  });
});
