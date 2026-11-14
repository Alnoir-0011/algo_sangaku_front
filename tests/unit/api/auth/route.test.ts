import { describe, test, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const handlersMock = vi.hoisted(() => ({ GET: vi.fn(), POST: vi.fn() }));

vi.mock("@/auth", () => ({ handlers: handlersMock }));

import { GET, POST } from "@/app/api/auth/[...nextauth]/route";

const SESSION_REISSUE = "authjs.session-token=abc; Path=/; HttpOnly";

const responseWith = (body: unknown = null, ...setCookies: string[]) => {
  const headers = new Headers({ "content-type": "application/json" });
  setCookies.forEach((value) => headers.append("set-cookie", value));
  return new Response(JSON.stringify(body), { headers });
};

const get = (path: string) => GET(new NextRequest(`http://localhost${path}`));
const post = (path: string) =>
  POST(new NextRequest(`http://localhost${path}`, { method: "POST" }));

describe("auth route", () => {
  beforeEach(() => {
    handlersMock.GET.mockReset();
    handlersMock.POST.mockReset();
  });

  describe("GET /api/auth/session", () => {
    test("should not allow the session check to re-issue my session cookie", async () => {
      handlersMock.GET.mockResolvedValue(responseWith(null, SESSION_REISSUE));

      const response = await get("/api/auth/session");

      expect(response.headers.getSetCookie()).toEqual([]);
    });

    test("should not allow the session check to expose my access token", async () => {
      handlersMock.GET.mockResolvedValue(
        responseWith({ user: { email: "a@example.com" }, accessToken: "secret" }),
      );

      const response = await get("/api/auth/session");

      expect(await response.json()).toEqual({ user: { email: "a@example.com" } });
    });

    test.each(["/api/auth/session/", "/api/auth//session", "/api/auth/session//"])(
      "should treat %s as the session check",
      async (path) => {
        handlersMock.GET.mockResolvedValue(
          responseWith({ user: {}, accessToken: "secret" }, SESSION_REISSUE),
        );

        const response = await get(path);

        expect(await response.json()).toEqual({ user: {} });
        expect(response.headers.getSetCookie()).toEqual([]);
      },
    );

    test.each(["/api/auth/session/extra", "/api/authx/session", "/api/auth"])(
      "should not treat %s as the session check",
      async (path) => {
        handlersMock.GET.mockResolvedValue(
          responseWith({ accessToken: "kept" }, SESSION_REISSUE),
        );

        const response = await get(path);

        expect(await response.json()).toEqual({ accessToken: "kept" });
        expect(response.headers.getSetCookie()).toEqual([SESSION_REISSUE]);
      },
    );
  });

  describe("GET of other auth requests", () => {
    test("should allow a callback to set my session cookie", async () => {
      handlersMock.GET.mockResolvedValue(responseWith(null, SESSION_REISSUE));

      const response = await get("/api/auth/callback/google");

      expect(response.headers.getSetCookie()).toEqual([SESSION_REISSUE]);
    });

    test("should keep the body of the providers request unchanged", async () => {
      handlersMock.GET.mockResolvedValue(
        responseWith({ google: {}, accessToken: "kept" }),
      );

      const response = await get("/api/auth/providers");

      expect(await response.json()).toEqual({ google: {}, accessToken: "kept" });
    });
  });

  describe("POST", () => {
    test("should not allow me to update my session through the API", async () => {
      const response = await post("/api/auth/session");

      expect(response.status).toBe(405);
      expect(response.headers.get("allow")).toBe("GET");
      expect(handlersMock.POST).not.toHaveBeenCalled();
    });

    test("should allow other POST requests to pass through unchanged", async () => {
      const expected = responseWith({ url: "/", accessToken: "kept" });
      handlersMock.POST.mockResolvedValue(expected);

      const response = await post("/api/auth/signout");

      expect(response).toBe(expected);
    });
  });
});
