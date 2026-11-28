import { describe, test, expect, vi, beforeEach } from "vitest";

const { signOutAndRedirectMock, setFlashMock } = vi.hoisted(() => ({
  signOutAndRedirectMock: vi.fn(),
  setFlashMock: vi.fn(),
}));

vi.mock("@/app/lib/session", () => ({
  signOutAndRedirect: signOutAndRedirectMock,
}));
vi.mock("@/app/lib/set-flash", () => ({ setFlash: setFlashMock }));

import { customSignOut } from "@/app/lib/actions/auth";

// customSignOut（サインアウト処理）
describe("customSignOut", () => {
  beforeEach(() => {
    signOutAndRedirectMock.mockReset();
    setFlashMock.mockReset();
  });

  // サインアウト完了のメッセージを表示し、サインインページへ遷移する
  test("should show the sign-out message and send me to the sign-in page", async () => {
    await customSignOut();

    expect(setFlashMock).toHaveBeenCalledWith({
      type: "success",
      message: "サインアウトしました",
    });
    expect(signOutAndRedirectMock).toHaveBeenCalledWith("/signin");
  });

  // サインアウトする前に、サインアウト完了のメッセージを表示する
  test("should show the sign-out message before signing me out", async () => {
    await customSignOut();

    expect(setFlashMock.mock.invocationCallOrder[0]).toBeLessThan(
      signOutAndRedirectMock.mock.invocationCallOrder[0],
    );
  });

  // サインアウト時のリダイレクトが伝播する
  test("should allow the sign-out redirect to propagate", async () => {
    const redirect = Object.assign(new Error("NEXT_REDIRECT"), {
      digest: "NEXT_REDIRECT;replace;/signin;307;",
    });
    signOutAndRedirectMock.mockRejectedValue(redirect);

    await expect(customSignOut()).rejects.toBe(redirect);
  });
});
