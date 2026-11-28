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

describe("proxy", () => {
  beforeEach(() => {
    getSessionApiMock.mockReset().mockResolvedValue(null);
    setFlashMock.mockReset();
    runGuardMock.mockReset().mockResolvedValue({ action: "allow" });
  });

  describe("when I am signed out", () => {
    test("should not allow me to open a page that needs sign-in", async () => {
      expect(redirectedTo(await run("/user/profile"))).toBe("/signin");
    });

    test("should allow me to see the sign-in notice when I am sent to the sign-in page", async () => {
      await run("/user/profile");

      expect(setFlashMock).toHaveBeenCalledWith({
        type: "warning",
        message: "サインインしてください",
      });
    });

    test("should allow me to open a public page", async () => {
      expect(await run("/shrines")).toBeUndefined();
    });

    test("should allow me to open the sign-in page", async () => {
      expect(await run("/signin")).toBeUndefined();
    });

    test("should not allow me to open the admin page", async () => {
      expect(redirectedTo(await run("/admin"))).toBe("/signin");
    });

    test("should allow me to request the auth API without being redirected", async () => {
      expect(await run("/api/auth/get-session")).toBeUndefined();
      expect(setFlashMock).not.toHaveBeenCalled();
    });

    test("should not allow me to open a route that only starts with the path of the auth API without signing in", async () => {
      expect(redirectedTo(await run("/api/authors"))).toBe("/signin");
    });
  });

  describe("when the rate limit is told who I am", () => {
    const emailPassedToGuard = async (path: string) => {
      await run(path);
      return runGuardMock.mock.calls[0][1].email;
    };

    test("should allow my email to be used for the rate limit when I am signed in", async () => {
      signedInAs("me@example.com");

      expect(await emailPassedToGuard("/shrines")).toBe("me@example.com");
    });

    test("should not allow an email to be used for the rate limit when I am signed out", async () => {
      expect(await emailPassedToGuard("/shrines")).toBeNull();
    });
  });

  describe("when the session of the auth library cannot be read", () => {
    beforeEach(() => {
      getSessionApiMock.mockRejectedValue(new Error("boom"));
      vi.spyOn(console, "error").mockImplementation(() => {});
    });

    test("should allow me to open a public page", async () => {
      expect(await run("/shrines")).toBeUndefined();
    });

    test("should allow me to open the sign-in page", async () => {
      expect(await run("/signin")).toBeUndefined();
    });

    test("should not allow me to open a page that needs sign-in", async () => {
      expect(redirectedTo(await run("/user/profile"))).toBe("/signin");
    });

    test("should not allow the rate limit to be skipped", async () => {
      await run("/shrines");

      expect(runGuardMock).toHaveBeenCalledTimes(1);
      expect(runGuardMock.mock.calls[0][1].email).toBeNull();
    });
  });

  describe("when I am signed in", () => {
    test("should allow me to open a page that needs sign-in", async () => {
      signedInAs("me@example.com");

      expect(await run("/user/profile")).toBeUndefined();
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

      expect(await run("/admin")).toBeUndefined();
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
