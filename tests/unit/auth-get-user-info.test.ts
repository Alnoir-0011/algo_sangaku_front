import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";

// auth.ts は読み込み時に、環境変数から設定を作る。import より前に用意する
vi.hoisted(() => {
  process.env.BETTER_AUTH_SECRET = "test-secret-for-get-user-info-012345678";
  process.env.BETTER_AUTH_URL = "http://localhost:4020";
  process.env.AUTH_GOOGLE_ID = "google-client-id";
  process.env.AUTH_GOOGLE_SECRET = "google-client-secret";
  process.env.API_URL = "http://api.test";
});

const { serverFetchMock, setFlashMock, revokeRailsApiKeyMock } = vi.hoisted(
  () => ({
    serverFetchMock: vi.fn(),
    setFlashMock: vi.fn(),
    revokeRailsApiKeyMock: vi.fn(),
  }),
);

vi.mock("@/app/lib/server-fetch", () => ({ serverFetch: serverFetchMock }));
vi.mock("@/app/lib/set-flash", () => ({ setFlash: setFlashMock }));
vi.mock("@/app/lib/rails-api-key", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/app/lib/rails-api-key")>()),
  revokeRailsApiKey: revokeRailsApiKeyMock,
}));

import { auth } from "@/auth";
import { DEFAULT_NETWORK_TIMEOUT_MS } from "@/app/lib/constants";
import { idTokenOf } from "@/tests/__helpers__/google-sign-in";

type GetUserInfo = (tokens: { idToken?: string }) => Promise<unknown>;

const validIdToken = idTokenOf({
  sub: "google-sub",
  email: "Me@Example.com",
  name: "Me",
  picture: "https://example.com/me.png",
  email_verified: true,
});

const backendOk = () =>
  new Response(
    JSON.stringify({ data: { attributes: { nickname: "nick", role: "admin" } } }),
    { status: 200, headers: { accesstoken: "api-token" } },
  );

const getUserInfo = () => {
  const google = auth.options.socialProviders?.google;
  return google?.getUserInfo as unknown as GetUserInfo;
};

describe("Google sign-in (getUserInfo)", () => {
  beforeEach(() => {
    serverFetchMock.mockReset().mockImplementation(async () => backendOk());
    setFlashMock.mockReset();
    revokeRailsApiKeyMock.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test("should allow me to sign in with the access token, nickname and role the backend gave", async () => {
    const result = await getUserInfo()({ idToken: validIdToken });

    expect(result).toMatchObject({
      user: {
        email: "Me@Example.com",
        name: "Me",
        emailVerified: true,
        railsAccessToken: "api-token",
        nickname: "nick",
        role: "admin",
      },
    });
  });

  test("should send my ID token to the backend", async () => {
    await getUserInfo()({ idToken: validIdToken });

    expect(serverFetchMock).toHaveBeenCalledWith(
      "http://api.test/api/v1/authenticate",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ token: validIdToken }),
      }),
    );
  });

  // サインインの成功が確定する前に出すと、後段の失敗（リンクの拒否など）で、
  // 失敗の表示と同時に出る。成功の通知は、フック（auth.test.ts）で出す
  test("should not show the sign-in message before the sign-in succeeds", async () => {
    await getUserInfo()({ idToken: validIdToken });

    expect(setFlashMock).not.toHaveBeenCalled();
  });

  describe("when something that can fail fails", () => {
    test("should not allow me to sign in without an ID token", async () => {
      expect(await getUserInfo()({})).toBeNull();
      expect(serverFetchMock).not.toHaveBeenCalled();
      expect(setFlashMock).not.toHaveBeenCalled();
    });

    test("should not leave an API key behind when my ID token cannot be decoded", async () => {
      expect(await getUserInfo()({ idToken: "not-a-token" })).toBeNull();
      expect(serverFetchMock).not.toHaveBeenCalled();
      expect(setFlashMock).not.toHaveBeenCalled();
    });

    test("should not leave an API key behind when my ID token has no email", async () => {
      const result = await getUserInfo()({
        idToken: idTokenOf({ sub: "google-sub", name: "Me" }),
      });

      expect(result).toBeNull();
      expect(serverFetchMock).not.toHaveBeenCalled();
      expect(setFlashMock).not.toHaveBeenCalled();
    });

    test("should not leave an API key behind when my ID token has no subject", async () => {
      const result = await getUserInfo()({
        idToken: idTokenOf({ email: "me@example.com", name: "Me" }),
      });

      expect(result).toBeNull();
      expect(serverFetchMock).not.toHaveBeenCalled();
    });

    test.each([
      ["role is unknown", { nickname: "nick", role: "owner" }],
      ["nickname is missing", { nickname: null, role: "admin" }],
    ])(
      "should delete the API key and not allow me to sign in when the backend gives a user whose %s",
      async (_label, attributes) => {
        serverFetchMock.mockResolvedValue(
          new Response(JSON.stringify({ data: { attributes } }), {
            status: 200,
            headers: { accesstoken: "api-token" },
          }),
        );

        expect(await getUserInfo()({ idToken: validIdToken })).toBeNull();
        expect(revokeRailsApiKeyMock).toHaveBeenCalledWith("api-token");
      },
    );

    test.each([401, 500])(
      "should not allow me to sign in when the backend responds with %i",
      async (status) => {
        serverFetchMock.mockResolvedValue(new Response("{}", { status }));

        expect(await getUserInfo()({ idToken: validIdToken })).toBeNull();
        expect(setFlashMock).not.toHaveBeenCalled();
      },
    );

    test("should not allow me to sign in when the backend gives no access token", async () => {
      serverFetchMock.mockResolvedValue(
        new Response(
          JSON.stringify({ data: { attributes: { nickname: "n", role: "x" } } }),
          { status: 200 },
        ),
      );

      expect(await getUserInfo()({ idToken: validIdToken })).toBeNull();
      expect(setFlashMock).not.toHaveBeenCalled();
    });

    test("should not allow me to sign in when the backend cannot be reached", async () => {
      serverFetchMock.mockRejectedValue(new TypeError("fetch failed"));

      expect(await getUserInfo()({ idToken: validIdToken })).toBeNull();
      expect(setFlashMock).not.toHaveBeenCalled();
    });

    test("should not allow the backend to keep me waiting for long when I sign in", async () => {
      vi.useFakeTimers();
      // 応答しないバックエンドを再現する。中断されたときだけ reject する
      serverFetchMock.mockImplementation(
        (_url: string, init: { signal: AbortSignal }) =>
          new Promise((_resolve, reject) => {
            init.signal.addEventListener("abort", () =>
              reject(new Error("aborted")),
            );
          }),
      );

      const pending = getUserInfo()({ idToken: validIdToken });
      await vi.advanceTimersByTimeAsync(DEFAULT_NETWORK_TIMEOUT_MS);

      expect(await pending).toBeNull();
      expect(setFlashMock).not.toHaveBeenCalled();
    });
  });
});
