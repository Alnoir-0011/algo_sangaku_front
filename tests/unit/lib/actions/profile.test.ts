import { describe, test, expect, vi, beforeEach } from "vitest";

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

import { updateProfile } from "@/app/lib/actions/profile";

const formOf = (nickname: string) => {
  const form = new FormData();
  form.set("nickname", nickname);
  return form;
};

const profileResponse = (nickname: string) =>
  new Response(JSON.stringify({ data: { attributes: { nickname } } }), {
    status: 200,
  });

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

  test("should allow my nickname in my session to follow the nickname the backend accepted", async () => {
    await expect(
      updateProfile({}, formOf("new")),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(updateSessionNicknameMock).toHaveBeenCalledWith("new");
    expect(setFlashMock).toHaveBeenCalledWith({
      type: "success",
      message: "プロフィールを更新しました",
    });
  });

  // Rails では更新済みなので、失敗として表示すると、再送信しても変わらない更新になる
  test("should show that my profile was updated even when my session could not follow it", async () => {
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

  test("should not update my nickname in my session when the backend did not accept it", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ errors: [] }), { status: 400 }),
      ),
    );

    await updateProfile({}, formOf(""));

    expect(updateSessionNicknameMock).not.toHaveBeenCalled();
  });

  test("should sign me out without asking the backend to delete my API key when the API responds with 401", async () => {
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
