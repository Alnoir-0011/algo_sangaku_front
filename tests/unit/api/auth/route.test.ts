import { describe, test, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const handlersMock = vi.hoisted(() => ({ GET: vi.fn(), POST: vi.fn() }));

vi.mock("@/auth", () => ({ handlers: handlersMock }));

import { GET, POST } from "@/app/api/auth/[...nextauth]/route";

const SESSION_REISSUE = "authjs.session-token=abc; Path=/; HttpOnly";

const responseWith = (...setCookies: string[]) => {
  const headers = new Headers();
  setCookies.forEach((value) => headers.append("set-cookie", value));
  return new Response(null, { headers });
};

describe("auth route", () => {
  beforeEach(() => {
    handlersMock.GET.mockReset();
  });

  test("should not allow the session check to re-issue my session cookie", async () => {
    handlersMock.GET.mockResolvedValue(responseWith(SESSION_REISSUE));

    const response = await GET(
      new NextRequest("http://localhost/api/auth/session"),
    );

    expect(response.headers.getSetCookie()).toEqual([]);
  });

  test("should allow other auth requests to set my session cookie", async () => {
    handlersMock.GET.mockResolvedValue(responseWith(SESSION_REISSUE));

    const response = await GET(
      new NextRequest("http://localhost/api/auth/callback/google"),
    );

    expect(response.headers.getSetCookie()).toEqual([SESSION_REISSUE]);
  });

  test("should allow the session update to re-issue my session cookie", () => {
    expect(POST).toBe(handlersMock.POST);
  });
});
