import { describe, test, expect } from "vitest";
import { toBrowserSession } from "@/app/lib/session-response";

const jsonResponse = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    ...init,
  });

describe("toBrowserSession", () => {
  test("should keep only the user, expiry and role of the session", async () => {
    const response = jsonResponse({
      user: { email: "a@example.com" },
      expires: "2026-11-20T00:00:00.000Z",
      accessToken: "secret",
      role: "general",
    });

    const body = await (await toBrowserSession(response)).json();

    expect(body).toEqual({
      user: { email: "a@example.com" },
      expires: "2026-11-20T00:00:00.000Z",
      role: "general",
    });
  });

  test("should not expose a field that is not listed for the browser", async () => {
    const response = jsonResponse({
      user: { email: "a@example.com" },
      refreshToken: "secret",
      idToken: "secret",
    });

    const body = await (await toBrowserSession(response)).json();

    expect(body).toEqual({ user: { email: "a@example.com" } });
  });

  test("should keep the status and every Set-Cookie of the response", async () => {
    const headers = new Headers({ "content-type": "application/json" });
    headers.append("set-cookie", "authjs.session-token=abc; Path=/");
    headers.append("set-cookie", "flash=1; Path=/");
    const response = new Response(JSON.stringify({ accessToken: "secret" }), {
      status: 201,
      headers,
    });

    const result = await toBrowserSession(response);

    expect(result.status).toBe(201);
    expect(result.headers.getSetCookie()).toEqual([
      "authjs.session-token=abc; Path=/",
      "flash=1; Path=/",
    ]);
  });

  test("should not keep the content length of the original body", async () => {
    const response = jsonResponse(
      { user: { email: "a@example.com" }, accessToken: "secret" },
      { headers: { "content-type": "application/json", "content-length": "999" } },
    );

    const result = await toBrowserSession(response);

    expect(result.headers.get("content-length")).toBeNull();
  });

  test("should return a signed-out session (null) unchanged", async () => {
    const result = await toBrowserSession(jsonResponse(null));

    expect(await result.json()).toBeNull();
  });

  test("should return a JSON array unchanged", async () => {
    const result = await toBrowserSession(jsonResponse([{ accessToken: "x" }]));

    expect(await result.json()).toEqual([{ accessToken: "x" }]);
  });

  test("should return a response without a JSON body unchanged", async () => {
    const response = new Response("not json", { status: 500 });

    const result = await toBrowserSession(response);

    expect(result.status).toBe(500);
    expect(await result.text()).toBe("not json");
  });

  test("should return a response without a body as it is", async () => {
    const response = new Response(null, { status: 204 });

    expect(await toBrowserSession(response)).toBe(response);
  });
});
