import { describe, test, expect, vi, beforeEach } from "vitest";

// beforeEach では設定しない。auth.ts は import の時点で、環境変数から設定を作るため
vi.hoisted(() => {
  process.env.BETTER_AUTH_SECRET = "test-secret-for-sign-out-01234567890123";
  process.env.BETTER_AUTH_URL = "http://localhost:4020";
  process.env.AUTH_GOOGLE_ID = "google-client-id";
  process.env.AUTH_GOOGLE_SECRET = "google-client-secret";
  process.env.API_URL = "http://api.test";
});

const { revokeRailsApiKeyMock, serverFetchMock } = vi.hoisted(() => ({
  revokeRailsApiKeyMock: vi.fn(),
  serverFetchMock: vi.fn(),
}));

vi.mock("@/app/lib/server-fetch", () => ({ serverFetch: serverFetchMock }));
vi.mock("@/app/lib/rails-api-key", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/app/lib/rails-api-key")>()),
  revokeRailsApiKey: revokeRailsApiKeyMock,
}));
vi.mock("@/app/lib/set-flash", () => ({ setFlash: vi.fn() }));

import { auth } from "@/auth";
import { createAuthKit, ORIGIN } from "@/tests/unit/auth/support";

const { signIn, post } = createAuthKit(auth, serverFetchMock);

beforeEach(() => {
  revokeRailsApiKeyMock.mockReset();
});

describe("signing out", () => {
  test("should allow me to sign out and have my API key deleted", async () => {
    const { cookie } = await signIn("my-token");

    await post("/sign-out", {}, cookie);

    expect(revokeRailsApiKeyMock).toHaveBeenCalledTimes(1);
    expect(revokeRailsApiKeyMock).toHaveBeenCalledWith("my-token");
  });

  test("should allow me to sign out and have my session cookie cleared", async () => {
    const { cookie } = await signIn("my-token");

    const response = await post("/sign-out", {}, cookie);

    for (const name of ["session_data", "session_token"]) {
      const cleared = response.headers
        .getSetCookie()
        .find((setCookie) => setCookie.startsWith(`better-auth.${name}=`));
      expect(cleared).toContain("Max-Age=0");
    }
  });

  test("should allow me to sign out without calling the backend when I have no session", async () => {
    const response = await post("/sign-out", {});

    expect(response.status).toBe(200);
    expect(revokeRailsApiKeyMock).not.toHaveBeenCalled();
  });

  test("should not allow a broken session cookie to call the backend", async () => {
    await post("/sign-out", {}, "better-auth.session_data=garbage");

    expect(revokeRailsApiKeyMock).not.toHaveBeenCalled();
  });
});

// ヘッダー名は、定数を import せず、リテラルで書く。定数が変わったときに、気づけるようにする
describe("signing out after the backend rejected my API key", () => {
  test("should allow the server to sign me out without deleting my API key", async () => {
    const { cookie } = await signIn("my-token");

    await auth.api.signOut({
      headers: new Headers({ cookie, "x-skip-api-key-revocation": "1" }),
    });

    expect(revokeRailsApiKeyMock).not.toHaveBeenCalled();
  });

  test("should not allow the browser to skip deleting my API key when I sign out", async () => {
    const { cookie } = await signIn("my-token");

    await auth.handler(
      new Request(`${ORIGIN}/api/auth/sign-out`, {
        method: "POST",
        headers: {
          cookie,
          origin: ORIGIN,
          "content-type": "application/json",
          "x-skip-api-key-revocation": "1",
        },
        body: "{}",
      }),
    );

    expect(revokeRailsApiKeyMock).toHaveBeenCalledWith("my-token");
  });
});
