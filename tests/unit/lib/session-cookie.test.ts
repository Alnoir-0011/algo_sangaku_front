import { describe, test, expect } from "vitest";
import { stripSessionCookieReissue } from "@/app/lib/session-cookie";

const responseWith = (...setCookies: string[]) => {
  const headers = new Headers();
  setCookies.forEach((value) => headers.append("set-cookie", value));
  return new Response(null, { headers });
};

describe("stripSessionCookieReissue", () => {
  test("should remove a re-issued session token", () => {
    const response = responseWith(
      "authjs.session-token=abc; Path=/; Expires=Fri, 20 Nov 2026 03:36:29 GMT; HttpOnly",
    );

    stripSessionCookieReissue(response);

    expect(response.headers.getSetCookie()).toEqual([]);
  });

  test("should remove a re-issued session token with the __Secure- prefix", () => {
    const response = responseWith(
      "__Secure-authjs.session-token=abc; Path=/; HttpOnly; Secure",
    );

    stripSessionCookieReissue(response);

    expect(response.headers.getSetCookie()).toEqual([]);
  });

  test("should remove every chunk of a re-issued session token", () => {
    const response = responseWith(
      "authjs.session-token.0=abc; Path=/",
      "authjs.session-token.1=def; Path=/",
    );

    stripSessionCookieReissue(response);

    expect(response.headers.getSetCookie()).toEqual([]);
  });

  test("should keep a session token deletion so that sign-out and invalid-session cleanup still work", () => {
    const deletion =
      "authjs.session-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0";
    const response = responseWith(deletion);

    stripSessionCookieReissue(response);

    expect(response.headers.getSetCookie()).toEqual([deletion]);
  });

  test("should remove the deletion that comes with a re-issue so that re-chunking does not sign me out", () => {
    const response = responseWith(
      "authjs.session-token.0=; Path=/; Max-Age=0",
      "authjs.session-token.1=; Path=/; Max-Age=0",
      "authjs.session-token=abc; Path=/",
    );

    stripSessionCookieReissue(response);

    expect(response.headers.getSetCookie()).toEqual([]);
  });

  test("should keep cookies other than the session token", () => {
    const flash = "flash=%7B%22type%22%3A%22info%22%7D; Path=/; HttpOnly";
    const callbackUrl = "authjs.callback-url=http%3A%2F%2Flocalhost; Path=/";
    const response = responseWith(
      callbackUrl,
      "authjs.session-token=abc; Path=/",
      flash,
    );

    stripSessionCookieReissue(response);

    expect(response.headers.getSetCookie()).toEqual([callbackUrl, flash]);
  });

  test("should not touch a cookie whose name only contains the session token name", () => {
    const lookalike = "my-authjs.session-token=abc; Path=/";
    const response = responseWith(lookalike);

    stripSessionCookieReissue(response);

    expect(response.headers.getSetCookie()).toEqual([lookalike]);
  });

  test("should leave a response without cookies unchanged", () => {
    const response = new Response("body", { status: 200 });

    stripSessionCookieReissue(response);

    expect(response.headers.getSetCookie()).toEqual([]);
  });
});
