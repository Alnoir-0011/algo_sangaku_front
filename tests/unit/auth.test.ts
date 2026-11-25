import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";

// auth.ts は読み込み時に、環境変数から設定を作る。import より前に用意する
vi.hoisted(() => {
  process.env.BETTER_AUTH_SECRET = "test-secret-for-auth-hooks-0123456789012";
  process.env.BETTER_AUTH_URL = "http://localhost:4020";
  process.env.AUTH_GOOGLE_ID = "google-client-id";
  process.env.AUTH_GOOGLE_SECRET = "google-client-secret";
  process.env.API_URL = "http://api.test";
});

const { revokeRailsApiKeyMock, serverFetchMock, setFlashMock } = vi.hoisted(
  () => ({
    revokeRailsApiKeyMock: vi.fn(),
    serverFetchMock: vi.fn(),
    setFlashMock: vi.fn(),
  }),
);

vi.mock("@/app/lib/server-fetch", () => ({ serverFetch: serverFetchMock }));
vi.mock("@/app/lib/rails-api-key", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/app/lib/rails-api-key")>()),
  revokeRailsApiKey: revokeRailsApiKeyMock,
}));
vi.mock("@/app/lib/set-flash", () => ({ setFlash: setFlashMock }));

import { auth } from "@/auth";
import {
  idTokenOf,
  mergeCookies,
  signInWithGoogle,
  stubGoogleTokenEndpoint,
} from "@/tests/__helpers__/google-sign-in";

const ORIGIN = "http://localhost:4020";

// サインインのたびに、バックエンドは新しい ApiKey を発行する
const backendIssues = (accessToken: string) =>
  serverFetchMock.mockImplementation(
    async () =>
      new Response(
        JSON.stringify({
          data: { attributes: { nickname: "nick", role: "admin" } },
        }),
        { status: 200, headers: { accesstoken: accessToken } },
      ),
  );

const signIn = async (accessToken: string, cookie = "") => {
  backendIssues(accessToken);
  stubGoogleTokenEndpoint(
    idTokenOf({ sub: "google-sub", email: "me@example.com", name: "Me" }),
  );
  return signInWithGoogle(auth, cookie);
};

// ブラウザからの要求を再現する。Origin の検査は、Better Auth がテスト環境で無効にするため、
// ここでは確認できない（実機で、他オリジンの POST が 403 になることを確認済み）
const post = (path: string, body: unknown, cookie?: string) =>
  auth.handler(
    new Request(`${ORIGIN}/api/auth${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: ORIGIN,
        ...(cookie ? { cookie } : {}),
      },
      body: JSON.stringify(body),
    }),
  );

const get = (path: string) =>
  auth.handler(new Request(`${ORIGIN}/api/auth${path}`));

describe("auth API for the browser", () => {
  test.each(["/ok", "/get-session"])(
    "should allow me to call %s",
    async (path) => {
      expect((await get(path)).status).toBe(200);
    },
  );

  test("should allow me to sign out", async () => {
    expect((await post("/sign-out", {})).status).toBe(200);
  });

  test.each([
    ["/update-user", { name: "x" }],
    ["/update-session", {}],
    ["/delete-user", {}],
    ["/change-email", { newEmail: "a@example.com" }],
    ["/revoke-sessions", {}],
    ["/link-social", { provider: "google" }],
    ["/sign-in/email", { email: "a@example.com", password: "password" }],
    ["/sign-up/email", { email: "a@example.com", password: "password", name: "a" }],
  ])("should not allow me to call %s", async (path, body) => {
    expect((await post(path, body)).status).toBe(404);
  });

  test.each(["/list-sessions", "/list-accounts", "/account-info"])(
    "should not allow me to read %s",
    async (path) => {
      expect((await get(path)).status).toBe(404);
    },
  );

  test("should not allow me to sign in with an ID token that skips the OAuth state", async () => {
    const response = await post("/sign-in/social", {
      provider: "google",
      idToken: { token: "leaked-token" },
    });

    expect(response.status).toBe(404);
  });

  test("should not allow me to start sign-in from the browser", async () => {
    const response = await post("/sign-in/social", {
      provider: "google",
      callbackURL: "/",
    });

    expect(response.status).toBe(404);
  });
});

describe("auth API for the server", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("should allow the server to start sign-in with Google", async () => {
    const { url } = await auth.api.signInSocial({
      body: { provider: "google", callbackURL: "/", disableRedirect: true },
    });

    expect(new URL(url!).host).toBe("accounts.google.com");
  });

  test("should allow the server to start sign-in with PKCE and a state", async () => {
    const { url } = await auth.api.signInSocial({
      body: { provider: "google", callbackURL: "/", disableRedirect: true },
    });

    const params = new URL(url!).searchParams;
    expect(params.get("code_challenge_method")).toBe("S256");
    expect(params.get("state")).toBeTruthy();
  });

  test("should not allow the server to call an endpoint that is not listed", async () => {
    await expect(
      auth.api.changeEmail({ body: { newEmail: "a@example.com" } }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  test("should allow the server to update my nickname without losing my access token", async () => {
    const { cookie } = await signIn("my-token");

    const response = await auth.api.updateUser({
      body: { nickname: "new nick" },
      headers: new Headers({ cookie }),
      asResponse: true,
    });
    const session = await auth.api.getSession({
      headers: new Headers({ cookie: mergeCookies(cookie, response) }),
    });

    expect(session?.user).toMatchObject({ nickname: "new nick" });
    expect(session?.session).toMatchObject({ railsAccessToken: "my-token" });
  });
});

describe("session lifetime", () => {
  const DAY = 24 * 60 * 60 * 1000;

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const travel = (ms: number) =>
    vi.useFakeTimers({ toFake: ["Date"], now: Date.now() + ms });

  const reissuesSessionToken = (response: Response) =>
    response.headers
      .getSetCookie()
      .some(
        (setCookie) =>
          setCookie.startsWith("better-auth.session_token=") &&
          !/max-age=0/i.test(setCookie),
      );

  test("should not allow my session to be extended when the cookie cache is skipped after a day", async () => {
    const { cookie } = await signIn("my-token");
    const before = await auth.api.getSession({
      headers: new Headers({ cookie }),
    });
    travel(2 * DAY);

    const response = await auth.api.getSession({
      headers: new Headers({ cookie }),
      query: { disableCookieCache: true },
      asResponse: true,
    });
    const after = await response.json();

    expect(new Date(after.session.expiresAt).getTime()).toBe(
      before!.session.expiresAt.getTime(),
    );
    expect(reissuesSessionToken(response)).toBe(false);
  });

  test("should not allow me to stay signed in after 7 days", async () => {
    const { cookie } = await signIn("my-token");
    travel(7 * DAY + 1000);

    expect(
      await auth.api.getSession({ headers: new Headers({ cookie }) }),
    ).toBeNull();
  });

  test("should not allow updating my nickname to extend my session beyond 7 days", async () => {
    const { cookie } = await signIn("my-token");
    travel(6 * DAY);
    const response = await auth.api.updateUser({
      body: { nickname: "new nick" },
      headers: new Headers({ cookie }),
      asResponse: true,
    });
    travel(DAY + 1000);

    expect(
      await auth.api.getSession({
        headers: new Headers({ cookie: mergeCookies(cookie, response) }),
      }),
    ).toBeNull();
  });
});

describe("cookies after signing in", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("should not allow the tokens from Google to be kept in a cookie", async () => {
    const { response } = await signIn("my-token");

    const names = response.headers
      .getSetCookie()
      .map((setCookie) => setCookie.split("=")[0]);
    expect(names.some((name) => name.endsWith("account_data"))).toBe(false);
  });

  const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60;

  const setCookieOf = (response: Response, name: string) =>
    response.headers
      .getSetCookie()
      .find((setCookie) => setCookie.startsWith(`better-auth.${name}=`));

  test.each(["session_token", "session_data"])(
    "should not allow scripts or other sites to use my cookie (%s)",
    async (name) => {
      const { response } = await signIn("my-token");

      const setCookie = setCookieOf(response, name);

      expect(setCookie).toMatch(/;\s*HttpOnly/i);
      expect(setCookie).toMatch(/;\s*SameSite=Lax/i);
    },
  );

  test.each(["session_token", "session_data"])(
    "should allow my cookie (%s) to last for 7 days and no longer",
    async (name) => {
      const { response } = await signIn("my-token");

      const maxAge = Number(
        setCookieOf(response, name)?.match(/Max-Age=(\d+)/i)?.[1],
      );

      expect(maxAge).toBeLessThanOrEqual(SEVEN_DAYS_SECONDS);
      expect(maxAge).toBeGreaterThan(SEVEN_DAYS_SECONDS - 60);
    },
  );
});

describe("session data for the browser", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test.each(["", "?disableCookieCache=true"])(
    "should not allow my access token to be sent to the browser (get-session%s)",
    async (query) => {
      const { cookie } = await signIn("secret-token");

      const response = await auth.handler(
        new Request(`${ORIGIN}/api/auth/get-session${query}`, {
          headers: { cookie },
        }),
      );
      const body = await response.text();

      expect(body).not.toContain("secret-token");
      expect(body).not.toContain("railsAccessToken");
      for (const setCookie of response.headers.getSetCookie()) {
        expect(setCookie).not.toContain("secret-token");
      }
    },
  );

  test("should allow the browser to see my nickname and role", async () => {
    const { cookie } = await signIn("secret-token");

    const response = await auth.handler(
      new Request(`${ORIGIN}/api/auth/get-session`, { headers: { cookie } }),
    );

    expect((await response.json()).user).toMatchObject({
      nickname: "nick",
      role: "admin",
    });
  });

  test("should allow the server to read my access token from my cookie alone", async () => {
    const { cookie } = await signIn("secret-token");

    const session = await auth.api.getSession({
      headers: new Headers({ cookie }),
    });

    expect(session?.session).toMatchObject({
      railsAccessToken: "secret-token",
    });
    expect(session?.user).toMatchObject({ nickname: "nick", role: "admin" });
  });

  // 拒否リスト（railsAccessToken だけを除く）だと、項目を足したときに、除き忘れて漏れる
  test("should allow the browser to see only the fields that are listed", async () => {
    const { cookie } = await signIn("secret-token");

    const response = await auth.handler(
      new Request(`${ORIGIN}/api/auth/get-session`, { headers: { cookie } }),
    );
    const body = await response.json();

    expect(Object.keys(body.session).sort()).toEqual([
      "createdAt",
      "expiresAt",
      "id",
      "updatedAt",
    ]);
    expect(Object.keys(body.user).sort()).toEqual([
      "createdAt",
      "email",
      "emailVerified",
      "id",
      "image",
      "name",
      "nickname",
      "role",
      "updatedAt",
    ].filter((key) => key in body.user));
    expect(body.session).not.toHaveProperty("token");
    expect(body.session).not.toHaveProperty("ipAddress");
    expect(body.session).not.toHaveProperty("userAgent");
  });
});

describe("signing in again", () => {
  beforeEach(() => {
    revokeRailsApiKeyMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("should delete my previous API key after I sign in again", async () => {
    const first = await signIn("first-token");
    vi.unstubAllGlobals();

    await signIn("second-token", first.cookie);

    expect(revokeRailsApiKeyMock).toHaveBeenCalledTimes(1);
    expect(revokeRailsApiKeyMock).toHaveBeenCalledWith("first-token");
  });

  test("should allow my new session to carry the new API key", async () => {
    const first = await signIn("first-token");
    vi.unstubAllGlobals();

    const second = await signIn("second-token", first.cookie);
    const session = await auth.api.getSession({
      headers: new Headers({ cookie: second.cookie }),
    });

    expect(session?.session).toMatchObject({ railsAccessToken: "second-token" });
  });

  test("should not allow my API key to be deleted when I had no session before", async () => {
    await signIn("first-token");

    expect(revokeRailsApiKeyMock).not.toHaveBeenCalled();
  });

  // GET で踏ませるだけで、サインイン中の利用者の ApiKey を失効させられてはならない
  test("should not allow my API key to be deleted by a callback that did not sign me in", async () => {
    const { cookie } = await signIn("my-token");
    revokeRailsApiKeyMock.mockReset();

    const response = await auth.handler(
      new Request(`${ORIGIN}/api/auth/callback/google?error=access_denied`, {
        headers: { cookie },
      }),
    );

    expect(response.status).toBe(302);
    expect(revokeRailsApiKeyMock).not.toHaveBeenCalled();
  });
});

// 同じ利用者の別の端末のサインインで、自分の端末のトークンが変わってはならない
describe("signing in on more than one device", () => {
  const tokenOf = (cookie: string, instance = auth) =>
    instance.api
      .getSession({ headers: new Headers({ cookie }) })
      .then((session) => session?.session as { railsAccessToken?: string });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("should allow each device to keep its own access token", async () => {
    const first = await signIn("token-of-pc");
    vi.unstubAllGlobals();
    const second = await signIn("token-of-phone");

    expect((await tokenOf(first.cookie))?.railsAccessToken).toBe("token-of-pc");
    expect((await tokenOf(second.cookie))?.railsAccessToken).toBe(
      "token-of-phone",
    );
  });

  test("should allow my access token to be kept when I update my nickname after signing in on another device", async () => {
    const pc = await signIn("token-of-pc");
    vi.unstubAllGlobals();
    await signIn("token-of-phone");

    const response = await auth.api.updateUser({
      body: { nickname: "new nick" },
      headers: new Headers({ cookie: pc.cookie }),
      asResponse: true,
    });
    const cookie = mergeCookies(pc.cookie, response);

    expect((await tokenOf(cookie))?.railsAccessToken).toBe("token-of-pc");
    const session = await auth.api.getSession({
      headers: new Headers({ cookie }),
    });
    expect(session?.user).toMatchObject({ nickname: "new nick" });
  });

  test("should allow my access token to be kept when my session cookie is rebuilt from the server", async () => {
    const pc = await signIn("token-of-pc");
    vi.unstubAllGlobals();
    await signIn("token-of-phone");

    const response = await auth.api.getSession({
      headers: new Headers({ cookie: pc.cookie }),
      query: { disableCookieCache: true },
      asResponse: true,
    });
    const cookie = mergeCookies(pc.cookie, response);

    expect((await tokenOf(cookie))?.railsAccessToken).toBe("token-of-pc");
  });

  test("should allow the server that has never seen my session to read my access token from my cookie", async () => {
    const { cookie } = await signIn("token-of-pc");
    vi.resetModules();
    const { auth: freshAuth } = await import("@/auth");

    expect((await tokenOf(cookie, freshAuth))?.railsAccessToken).toBe(
      "token-of-pc",
    );
  });
});

describe("queries that skip the cookie cache", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test.each([
    ["GET", "/get-session?disableCookieCache=true"],
    ["GET", "/get-session?disableRefresh=true"],
    ["GET", "/callback/google?error=access_denied&disableCookieCache=true"],
    ["POST", "/sign-out?disableCookieCache=true"],
    ["GET", "/ok?disableRefresh=true"],
  ])("should not allow the browser to send %s %s", async (method, path) => {
    const { cookie } = await signIn("my-token");

    const response = await auth.handler(
      new Request(`${ORIGIN}/api/auth${path}`, {
        method,
        headers: {
          cookie,
          origin: ORIGIN,
          ...(method === "POST" ? { "content-type": "application/json" } : {}),
        },
        ...(method === "POST" ? { body: "{}" } : {}),
      }),
    );

    expect(response.status).toBe(400);
    expect(response.headers.getSetCookie()).toEqual([]);
  });
});

describe("signing out", () => {
  beforeEach(() => {
    revokeRailsApiKeyMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("should delete my API key when I sign out", async () => {
    const { cookie } = await signIn("my-token");
    revokeRailsApiKeyMock.mockReset();

    await post("/sign-out", {}, cookie);

    expect(revokeRailsApiKeyMock).toHaveBeenCalledWith("my-token");
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

  test("should clear my session cookie when I sign out", async () => {
    const { cookie } = await signIn("my-token");

    const response = await post("/sign-out", {}, cookie);

    for (const name of ["session_data", "session_token"]) {
      const cleared = response.headers
        .getSetCookie()
        .find((setCookie) => setCookie.startsWith(`better-auth.${name}=`));
      expect(cleared).toContain("Max-Age=0");
    }
  });
});

describe("sign-in message", () => {
  beforeEach(() => {
    setFlashMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("should show the sign-in message once I have signed in", async () => {
    await signIn("my-token");

    expect(setFlashMock).toHaveBeenCalledTimes(1);
    expect(setFlashMock).toHaveBeenCalledWith({
      type: "success",
      message: "サインインしました",
    });
  });

  test("should not show the sign-in message when the sign-in did not succeed", async () => {
    const response = await auth.handler(
      new Request(`${ORIGIN}/api/auth/callback/google?error=access_denied`),
    );

    expect(response.status).toBe(302);
    expect(setFlashMock).not.toHaveBeenCalled();
  });

  // getUserInfo は成功を返しても、Better Auth がこのあと、リンクの拒否などで失敗しうる
  test("should not show the sign-in message when the sign-in failed after the backend accepted me", async () => {
    backendIssues("my-token");
    stubGoogleTokenEndpoint(
      idTokenOf({ email: "me@example.com", name: "Me" }),
    );

    const { response } = await signInWithGoogle(auth);

    expect(response.headers.get("location")).toContain("error=");
    expect(setFlashMock).not.toHaveBeenCalled();
  });
});

describe("sign-in failure", () => {
  test("should send me to the sign-in page with the error when the state is missing", async () => {
    const response = await auth.handler(
      new Request(`${ORIGIN}/api/auth/callback/google?code=code&state=unknown`),
    );

    const location = new URL(response.headers.get("location")!, ORIGIN);
    expect(location.pathname).toBe("/signin");
    expect(location.searchParams.get("error")).toBeTruthy();
  });
});

describe("signing out after the backend rejected my API key", () => {
  beforeEach(() => {
    revokeRailsApiKeyMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("should not ask the backend to delete my API key when the server asks not to", async () => {
    const { cookie } = await signIn("my-token");
    revokeRailsApiKeyMock.mockReset();

    await auth.api.signOut({
      headers: new Headers({ cookie, "x-skip-api-key-revocation": "1" }),
    });

    expect(revokeRailsApiKeyMock).not.toHaveBeenCalled();
  });

  test("should not allow the browser to ask not to delete the API key of another session", async () => {
    const { cookie } = await signIn("my-token");
    revokeRailsApiKeyMock.mockReset();

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
