import { describe, test, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getSessionApiMock, setFlashMock } = vi.hoisted(() => ({
  getSessionApiMock: vi.fn(),
  setFlashMock: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: { api: { getSession: getSessionApiMock } } }));
vi.mock("@/app/lib/set-flash", () => ({ setFlash: setFlashMock }));
vi.mock("@/app/lib/guard", () => ({
  runGuard: vi.fn().mockResolvedValue({ action: "allow" }),
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

describe("proxy", () => {
  beforeEach(() => {
    getSessionApiMock.mockReset().mockResolvedValue(null);
    setFlashMock.mockReset();
  });

  describe("when I am signed out", () => {
    test("should not allow me to open a page that needs sign-in", async () => {
      expect(redirectedTo(await run("/user/profile"))).toBe("/signin");
    });

    test("should tell me to sign in when I am sent to the sign-in page", async () => {
      await run("/user/profile");

      expect(setFlashMock).toHaveBeenCalledWith({
        type: "warning",
        message: "サインインしてください",
      });
    });

    test("should allow me to open a public page", async () => {
      expect(redirectedTo(await run("/shrines"))).toBeNull();
    });

    test("should allow me to open the sign-in page", async () => {
      expect(redirectedTo(await run("/signin"))).toBeNull();
    });

    test("should not allow me to open the admin page", async () => {
      expect(redirectedTo(await run("/admin"))).toBe("/signin");
    });

    test("should leave requests to the auth API alone", async () => {
      expect(redirectedTo(await run("/api/auth/get-session"))).toBeNull();
      expect(setFlashMock).not.toHaveBeenCalled();
    });

    test("should not leave requests to a route that only starts with the path of the auth API alone", async () => {
      expect(redirectedTo(await run("/api/authors"))).toBe("/signin");
    });
  });

  describe("when the session of the auth library cannot be read", () => {
    beforeEach(() => {
      getSessionApiMock.mockRejectedValue(new Error("boom"));
      vi.spyOn(console, "error").mockImplementation(() => {});
    });

    test("should allow me to open a public page", async () => {
      expect(redirectedTo(await run("/shrines"))).toBeNull();
    });

    test("should allow me to open the sign-in page", async () => {
      expect(redirectedTo(await run("/signin"))).toBeNull();
    });

    test("should not allow me to open a page that needs sign-in", async () => {
      expect(redirectedTo(await run("/user/profile"))).toBe("/signin");
    });
  });

  describe("when I am signed in", () => {
    test("should allow me to open a page that needs sign-in", async () => {
      signedInAs("me@example.com");

      expect(redirectedTo(await run("/user/profile"))).toBeNull();
    });

    test("should not allow me to open the sign-in page", async () => {
      signedInAs("me@example.com");

      expect(redirectedTo(await run("/signin"))).toBe("/");
    });

    test("should not allow a general user to open the admin page", async () => {
      signedInAs("me@example.com", "general");

      expect(redirectedTo(await run("/admin"))).toBe("/");
    });

    test("should allow an admin to open the admin page", async () => {
      signedInAs("me@example.com", "admin");

      expect(redirectedTo(await run("/admin"))).toBeNull();
    });
  });

  describe("when my session has no access token for the backend", () => {
    test("should not allow me to open a page that needs sign-in", async () => {
      getSessionApiMock.mockResolvedValue({ user: { email: "me@example.com" } });

      expect(redirectedTo(await run("/user/profile"))).toBe("/signin");
    });

    test("should not allow me to open the admin page even if my role says admin", async () => {
      getSessionApiMock.mockResolvedValue({
        session: {},
        user: { email: "me@example.com", nickname: "nick", role: "admin" },
      });

      expect(redirectedTo(await run("/admin"))).toBe("/signin");
    });
  });
});
