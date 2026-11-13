import { describe, test, expect, vi, beforeEach } from "vitest";
import type { NextFetchEvent, NextRequest } from "next/server";

const authProxyMock = vi.hoisted(() => vi.fn());

vi.mock("@/auth", () => ({ auth: () => authProxyMock }));
vi.mock("@/app/lib/set-flash", () => ({ setFlash: vi.fn() }));
vi.mock("@/app/lib/guard", () => ({
  runGuard: vi.fn(),
  resolveGuardMode: vi.fn(),
  getDefaultLimiter: vi.fn(),
}));

import proxy from "@/proxy";

const FLASH = "flash=%7B%22type%22%3A%22info%22%7D; Path=/; HttpOnly";

const responseWith = (...setCookies: string[]) => {
  const headers = new Headers();
  setCookies.forEach((value) => headers.append("set-cookie", value));
  return new Response(null, { headers });
};

const run = () => proxy({} as NextRequest, {} as NextFetchEvent);

describe("proxy", () => {
  beforeEach(() => {
    authProxyMock.mockReset();
  });

  test("should not allow the response of the auth wrapper to re-issue my session cookie", async () => {
    authProxyMock.mockResolvedValue(
      responseWith(FLASH, "authjs.session-token=abc; Path=/; HttpOnly"),
    );

    const response = await run();

    expect(response?.headers.getSetCookie()).toEqual([FLASH]);
  });

  test("should allow the request to continue when the auth wrapper returns nothing", async () => {
    authProxyMock.mockResolvedValue(undefined);

    expect(await run()).toBeUndefined();
  });
});
