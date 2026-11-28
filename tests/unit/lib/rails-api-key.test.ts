import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";

const { serverFetchMock } = vi.hoisted(() => ({ serverFetchMock: vi.fn() }));

vi.mock("@/app/lib/server-fetch", () => ({ serverFetch: serverFetchMock }));
vi.mock("@/app/lib/config", () => ({ apiUrl: "http://api.test" }));

import { revokeRailsApiKey, withTimeout } from "@/app/lib/rails-api-key";

// revokeRailsApiKey（Rails の API キーの失効）
describe("revokeRailsApiKey", () => {
  beforeEach(() => {
    serverFetchMock.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // アクセストークンを使って、自分の API キーを削除する
  test("should delete my API key with my access token", async () => {
    serverFetchMock.mockResolvedValue(new Response("{}", { status: 200 }));

    await revokeRailsApiKey("token");

    expect(serverFetchMock).toHaveBeenCalledWith(
      "http://api.test/api/v1/authenticate",
      expect.objectContaining({ method: "DELETE", token: "token" }),
    );
  });

  // 使わないレスポンスボディを放置して、バックエンドとの接続を占有しない
  test("should not allow the response body that is not used to keep the connection to the backend busy", async () => {
    const response = new Response("{}", { status: 200 });
    const cancel = vi.spyOn(response.body!, "cancel");
    serverFetchMock.mockResolvedValue(response);

    await revokeRailsApiKey("token");

    expect(cancel).toHaveBeenCalledTimes(1);
  });

  // バックエンドがエラーを返しても、サインアウトできる
  test("should allow me to sign out even when the backend responds with an error", async () => {
    serverFetchMock.mockResolvedValue(new Response("{}", { status: 500 }));

    await expect(revokeRailsApiKey("token")).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalledWith(
      "[auth] backend sign-out failed:",
      500,
    );
  });

  // すでに無効な API キーを、失敗として報告しない
  test("should not allow an already invalid API key to be reported as a failure", async () => {
    serverFetchMock.mockResolvedValue(new Response("{}", { status: 401 }));

    await revokeRailsApiKey("token");

    expect(console.error).not.toHaveBeenCalled();
  });

  // バックエンドに到達できなくても、サインアウトできる
  test("should allow me to sign out even when the backend cannot be reached", async () => {
    const error = new TypeError("fetch failed");
    serverFetchMock.mockRejectedValue(error);

    await expect(revokeRailsApiKey("token")).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalledWith(
      "[auth] backend sign-out failed:",
      error,
    );
  });

  // サインアウト時に、バックエンドの応答を長く待たされない
  test("should not allow the backend to keep me waiting for long when signing out", async () => {
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
    const pending = revokeRailsApiKey("token");
    await vi.advanceTimersByTimeAsync(5_000);

    await expect(pending).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalledWith(
      "[auth] backend sign-out failed:",
      expect.any(Error),
    );
  });
});

// withTimeout（タイムアウト付きの実行）
describe("withTimeout", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  // 処理が時間内に終わったとき、結果を取得できる
  test("should allow me to get the result when the work finishes in time", async () => {
    await expect(withTimeout(1_000, async () => "done")).resolves.toBe("done");
  });

  // 終わった処理に、タイマーを残さない
  test("should not allow a finished work to leave a timer behind", async () => {
    vi.useFakeTimers();

    await withTimeout(1_000, async () => "done");

    expect(vi.getTimerCount()).toBe(0);
  });

  // 処理が制限時間を超えたとき、処理を中断する
  test("should abort the work when it takes longer than the limit", async () => {
    vi.useFakeTimers();
    let aborted = false;

    const pending = withTimeout(1_000, (signal) => {
      signal.addEventListener("abort", () => {
        aborted = true;
      });
      return new Promise<never>(() => {});
    });
    // await しない。中断後も未解決のままの Promise を待つと、このテストが終わらない
    void pending;
    await vi.advanceTimersByTimeAsync(1_000);

    expect(aborted).toBe(true);
  });
});
