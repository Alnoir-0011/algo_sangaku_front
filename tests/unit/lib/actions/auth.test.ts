import { describe, test, expect, vi, beforeEach } from "vitest";

const { authMock, signOutMock, setFlashMock, serverFetchMock } = vi.hoisted(
  () => ({
    authMock: vi.fn(),
    signOutMock: vi.fn(),
    setFlashMock: vi.fn(),
    serverFetchMock: vi.fn(),
  }),
);

vi.mock("@/auth", () => ({ auth: authMock, signOut: signOutMock }));
vi.mock("@/app/lib/set-flash", () => ({ setFlash: setFlashMock }));
vi.mock("@/app/lib/server-fetch", () => ({ serverFetch: serverFetchMock }));

import { customSignOut } from "@/app/lib/actions/auth";

describe("customSignOut", () => {
  beforeEach(() => {
    authMock.mockReset().mockResolvedValue({ accessToken: "token" });
    signOutMock.mockReset();
    setFlashMock.mockReset();
    serverFetchMock.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(console.error).mockClear();
  });

  test("should delete my API key and sign me out", async () => {
    serverFetchMock.mockResolvedValue(new Response("{}", { status: 200 }));

    await customSignOut();

    expect(serverFetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/authenticate"),
      expect.objectContaining({ method: "DELETE", token: "token" }),
    );
    expect(setFlashMock).toHaveBeenCalledWith({
      type: "success",
      message: "サインアウトしました",
    });
    expect(signOutMock).toHaveBeenCalledWith({ redirectTo: "/signin" });
  });

  test("should allow me to sign out even when the backend responds with an error", async () => {
    serverFetchMock.mockResolvedValue(new Response("{}", { status: 500 }));

    await customSignOut();

    expect(signOutMock).toHaveBeenCalledWith({ redirectTo: "/signin" });
    expect(console.error).toHaveBeenCalled();
  });

  test("should not allow an already invalid API key to be reported as a failure", async () => {
    serverFetchMock.mockResolvedValue(new Response("{}", { status: 401 }));

    await customSignOut();

    expect(signOutMock).toHaveBeenCalledWith({ redirectTo: "/signin" });
    expect(console.error).not.toHaveBeenCalled();
  });

  test("should not allow the backend to keep me waiting for long when signing out", async () => {
    serverFetchMock.mockResolvedValue(new Response("{}", { status: 200 }));

    await customSignOut();

    expect(serverFetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ timeoutMs: 3_000 }),
    );
  });

  test.each([null, {}])(
    "should allow me to sign out without calling the backend when I have no access token (%j)",
    async (session) => {
      authMock.mockResolvedValue(session);

      await customSignOut();

      expect(serverFetchMock).not.toHaveBeenCalled();
      expect(signOutMock).toHaveBeenCalledWith({ redirectTo: "/signin" });
    },
  );

  test("should allow me to sign out even when the backend cannot be reached", async () => {
    serverFetchMock.mockRejectedValue(new TypeError("fetch failed"));

    await customSignOut();

    expect(signOutMock).toHaveBeenCalledWith({ redirectTo: "/signin" });
  });

  test("should allow the sign-out redirect to propagate", async () => {
    serverFetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    const redirect = Object.assign(new Error("NEXT_REDIRECT"), {
      digest: "NEXT_REDIRECT;replace;/signin;307;",
    });
    signOutMock.mockRejectedValue(redirect);

    await expect(customSignOut()).rejects.toBe(redirect);
  });
});
