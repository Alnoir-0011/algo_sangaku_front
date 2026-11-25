import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";

// beforeEach では設定しない。auth.ts は import の時点で、環境変数から設定を作るため
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
import { idTokenOf } from "@/tests/unit/auth/support";

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

describe("Google sign-in", () => {
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
    expect(revokeRailsApiKeyMock).not.toHaveBeenCalled();
  });

  test("should allow me to be identified by the backend with my ID token", async () => {
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
  // 失敗の表示と同時に出る。成功の通知は、フック（sign-in.test.ts）で出す
  test("should not allow me to see the sign-in message before the sign-in succeeds", async () => {
    const result = await getUserInfo()({ idToken: validIdToken });

    expect(result).not.toBeNull();
    expect(setFlashMock).not.toHaveBeenCalled();
  });

  describe("when something that can fail fails", () => {
    test("should not allow me to sign in without an ID token", async () => {
      expect(await getUserInfo()({})).toBeNull();
      expect(serverFetchMock).not.toHaveBeenCalled();
    });

    test("should not leave an API key behind when my ID token cannot be decoded", async () => {
      expect(await getUserInfo()({ idToken: "not-a-token" })).toBeNull();
      expect(serverFetchMock).not.toHaveBeenCalled();
    });

    test("should not leave an API key behind when my ID token has no email", async () => {
      const result = await getUserInfo()({
        idToken: idTokenOf({ sub: "google-sub", name: "Me" }),
      });

      expect(result).toBeNull();
      expect(serverFetchMock).not.toHaveBeenCalled();
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
      },
    );

    test("should not allow me to sign in when the backend gives no access token", async () => {
      serverFetchMock.mockResolvedValue(
        new Response(
          JSON.stringify({ data: { attributes: { nickname: "n", role: "admin" } } }),
          { status: 200 },
        ),
      );

      expect(await getUserInfo()({ idToken: validIdToken })).toBeNull();
    });

    test("should delete the API key when the backend accepted me but gave a body that cannot be read", async () => {
      serverFetchMock.mockResolvedValue(
        new Response("not json", {
          status: 200,
          headers: { accesstoken: "api-token" },
        }),
      );

      expect(await getUserInfo()({ idToken: validIdToken })).toBeNull();
      expect(revokeRailsApiKeyMock).toHaveBeenCalledWith("api-token");
    });

    test("should delete the API key when the backend accepted me but gave no user", async () => {
      serverFetchMock.mockResolvedValue(
        new Response(JSON.stringify({}), {
          status: 200,
          headers: { accesstoken: "api-token" },
        }),
      );

      expect(await getUserInfo()({ idToken: validIdToken })).toBeNull();
      expect(revokeRailsApiKeyMock).toHaveBeenCalledWith("api-token");
    });

    test("should not allow me to sign in when the backend cannot be reached", async () => {
      serverFetchMock.mockRejectedValue(new TypeError("fetch failed"));

      expect(await getUserInfo()({ idToken: validIdToken })).toBeNull();
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

      // 定数そのものでなく、固定の長さで進める。定数が長くなったときに、気づけるようにする
      const pending = getUserInfo()({ idToken: validIdToken });
      await vi.advanceTimersByTimeAsync(10_000);

      expect(await pending).toBeNull();
    });
  });
});
