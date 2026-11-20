import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { APIError } from "better-auth/api";

const { signInEmailMock, signUpEmailMock, redirectMock } = vi.hoisted(() => ({
  signInEmailMock: vi.fn(),
  signUpEmailMock: vi.fn(),
  redirectMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: { api: { signInEmail: signInEmailMock, signUpEmail: signUpEmailMock } },
}));
vi.mock("@/app/lib/session", () => ({
  requestHeaders: vi.fn().mockResolvedValue(new Headers()),
}));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));

import { testSignIn } from "@/app/lib/actions/test-sign-in";

const formOf = (email: string, password = "password") => {
  const form = new FormData();
  form.set("email", email);
  form.set("password", password);
  return form;
};

const unknownUser = () => new APIError("UNAUTHORIZED", { message: "no user" });

describe("testSignIn", () => {
  beforeEach(() => {
    vi.stubEnv("APP_ENV", "test");
    signInEmailMock.mockReset().mockResolvedValue({});
    signUpEmailMock.mockReset().mockResolvedValue({});
    redirectMock.mockReset().mockImplementation((path: string) => {
      throw new Error(`NEXT_REDIRECT:${path}`);
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("should allow me to sign in as a user that already exists without signing up again", async () => {
    await expect(testSignIn(formOf("me@example.com"))).rejects.toThrow(
      "NEXT_REDIRECT:/",
    );

    expect(signUpEmailMock).not.toHaveBeenCalled();
  });

  test("should allow me to sign up with the fields of the backend when the user does not exist yet", async () => {
    signInEmailMock.mockRejectedValue(unknownUser());

    await expect(testSignIn(formOf("me@example.com"))).rejects.toThrow(
      "NEXT_REDIRECT:/",
    );

    expect(signUpEmailMock).toHaveBeenCalledTimes(1);
    expect(signUpEmailMock.mock.calls[0][0].body).toMatchObject({
      email: "me@example.com",
      railsAccessToken: "dummy_token",
      nickname: "test_nickname",
      role: "general",
    });
  });

  // 並列のテストが、同じメールで同時に初めてサインインすると、両方がサインアップに進む
  test("should allow me to sign in when another sign-up of the same user won the race", async () => {
    signInEmailMock
      .mockRejectedValueOnce(unknownUser())
      .mockResolvedValueOnce({});
    signUpEmailMock.mockRejectedValue(
      new APIError("UNPROCESSABLE_ENTITY", {
        message: "User already exists. Use another email.",
        code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL",
      }),
    );

    await expect(testSignIn(formOf("me@example.com"))).rejects.toThrow(
      "NEXT_REDIRECT:/",
    );

    expect(signInEmailMock).toHaveBeenCalledTimes(2);
  });

  test("should not hide a failure of the sign-up that is not a race", async () => {
    const error = new APIError("INTERNAL_SERVER_ERROR", { message: "boom" });
    signInEmailMock.mockRejectedValue(unknownUser());
    signUpEmailMock.mockRejectedValue(error);

    await expect(testSignIn(formOf("me@example.com"))).rejects.toBe(error);

    expect(signInEmailMock).toHaveBeenCalledTimes(1);
  });

  test.each(["admin_user@example.com", "Admin_User@Example.com"])(
    "should allow %s to be an admin regardless of letter case",
    async (email) => {
      signInEmailMock.mockRejectedValue(unknownUser());

      await expect(testSignIn(formOf(email))).rejects.toThrow();

      expect(signUpEmailMock.mock.calls[0][0].body.role).toBe("admin");
    },
  );

  test.each([
    ["an error that is not from the auth library", new Error("boom")],
    [
      "a failure of the server",
      new APIError("INTERNAL_SERVER_ERROR", { message: "boom" }),
    ],
  ])(
    "should not hide %s behind a duplicate sign-up",
    async (_label, error) => {
      signInEmailMock.mockRejectedValue(error);

      await expect(testSignIn(formOf("me@example.com"))).rejects.toBe(error);

      expect(signUpEmailMock).not.toHaveBeenCalled();
    },
  );

  test("should not allow me to sign in with a wrong password", async () => {
    await expect(
      testSignIn(formOf("me@example.com", "wrong")),
    ).rejects.toThrow("NEXT_REDIRECT:/signin?error=credentials");

    expect(signInEmailMock).not.toHaveBeenCalled();
    expect(signUpEmailMock).not.toHaveBeenCalled();
  });

  test("should not allow the sign-in outside the test environment", async () => {
    vi.stubEnv("APP_ENV", "production");

    await expect(testSignIn(formOf("me@example.com"))).rejects.toThrow(
      "Not found",
    );
    expect(signInEmailMock).not.toHaveBeenCalled();
  });
});
