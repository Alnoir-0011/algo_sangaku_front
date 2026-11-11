import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";

const { cookieSetMock } = vi.hoisted(() => ({
  cookieSetMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({ set: cookieSetMock }),
}));

import { setFlash } from "@/app/lib/set-flash";

describe("setFlash", () => {
  beforeEach(() => {
    cookieSetMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("should store the flash as JSON in the flash cookie", async () => {
    // Act
    await setFlash({ type: "success", message: "保存しました" });

    // Assert
    expect(cookieSetMock).toHaveBeenCalledTimes(1);
    const [name, value] = cookieSetMock.mock.calls[0];
    expect(name).toBe("flash");
    expect(JSON.parse(value)).toEqual({
      type: "success",
      message: "保存しました",
    });
  });

  test("should set the flash cookie as httpOnly, sameSite lax, site-wide and valid for 60 seconds", async () => {
    // Act
    await setFlash({ type: "info", message: "お知らせ" });

    // Assert
    const options = cookieSetMock.mock.calls[0][2];
    expect(options).toMatchObject({
      path: "/",
      maxAge: 60,
      httpOnly: true,
      sameSite: "lax",
    });
  });

  test("should set the secure attribute when APP_ENV is not test", async () => {
    // Arrange
    vi.stubEnv("APP_ENV", "production");

    // Act
    await setFlash({ type: "error", message: "失敗しました" });

    // Assert
    expect(cookieSetMock.mock.calls[0][2].secure).toBe(true);
  });

  test("should set the secure attribute when APP_ENV is unset", async () => {
    // Arrange
    vi.stubEnv("APP_ENV", undefined);

    // Act
    await setFlash({ type: "error", message: "失敗しました" });

    // Assert
    expect(cookieSetMock.mock.calls[0][2].secure).toBe(true);
  });

  test("should not set the secure attribute when APP_ENV is test", async () => {
    // Arrange
    vi.stubEnv("APP_ENV", "test");

    // Act
    await setFlash({ type: "error", message: "失敗しました" });

    // Assert
    expect(cookieSetMock.mock.calls[0][2].secure).toBe(false);
  });
});
