import { describe, test, expect, vi, beforeEach } from "vitest";

const { getSessionMock, checkRunSourceRateLimitMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  checkRunSourceRateLimitMock: vi.fn(),
}));

vi.mock("@/app/lib/session", () => ({
  getSession: getSessionMock,
}));

vi.mock("@/app/lib/rate-limit/run-source", () => ({
  checkRunSourceRateLimit: checkRunSourceRateLimitMock,
}));

import { runSource } from "@/app/lib/actions/sangaku";

const validSource = "puts 'hello'";
const authedSession = {
  accessToken: "token",
  user: { email: "user@example.com" },
};

// runSource（ソースコードの実行）
describe("runSource", () => {
  beforeEach(() => {
    getSessionMock.mockReset();
    checkRunSourceRateLimitMock.mockReset().mockResolvedValue(true);
    vi.stubGlobal("fetch", vi.fn());
  });

  // セッションがないとき、PaizaIO を呼ばない
  test("should not call PaizaIO when there is no session", async () => {
    getSessionMock.mockResolvedValue(null);

    await expect(runSource(validSource, [""])).rejects.toThrow(
      "認証が必要です",
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  // source が文字列でないとき、PaizaIO を呼ばない
  test("should not call PaizaIO when source is not a string", async () => {
    getSessionMock.mockResolvedValue(authedSession);

    // @ts-expect-error 実行時の型迂回を検証するため意図的に不正な型を渡す
    await expect(runSource(["not", "a", "string"], [""])).rejects.toThrow(
      "不正なリクエストです",
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  // fixedInputs に文字列でない要素が含まれるとき、PaizaIO を呼ばない
  test("should not call PaizaIO when fixedInputs contains a non-string element", async () => {
    getSessionMock.mockResolvedValue(authedSession);

    await expect(
      // @ts-expect-error 実行時の型迂回を検証するため意図的に不正な型を渡す
      runSource(validSource, [["A".repeat(70_000)]]),
    ).rejects.toThrow("不正なリクエストです");
    expect(fetch).not.toHaveBeenCalled();
  });

  // fixedInputs の要素数が多すぎるとき、PaizaIO を呼ばない
  test("should not call PaizaIO when fixedInputs has too many elements", async () => {
    getSessionMock.mockResolvedValue(authedSession);

    await expect(
      runSource(validSource, Array(21).fill("")),
    ).rejects.toThrow("入力ケースが多すぎます");
    expect(fetch).not.toHaveBeenCalled();
  });

  // source が長すぎるとき、PaizaIO を呼ばない
  test("should not call PaizaIO when source is too long", async () => {
    getSessionMock.mockResolvedValue(authedSession);

    await expect(
      runSource("a".repeat(65_536), [""]),
    ).rejects.toThrow("入力が長すぎます");
    expect(fetch).not.toHaveBeenCalled();
  });

  // 固定入力が長すぎるとき、PaizaIO を呼ばない
  test("should not call PaizaIO when a fixed input is too long", async () => {
    getSessionMock.mockResolvedValue(authedSession);

    await expect(
      runSource(validSource, ["a".repeat(65_536)]),
    ).rejects.toThrow("入力が長すぎます");
    expect(fetch).not.toHaveBeenCalled();
  });

  // レート制限を超えたとき、PaizaIO を呼ばない
  test("should not call PaizaIO when the rate limit is exceeded", async () => {
    getSessionMock.mockResolvedValue(authedSession);
    checkRunSourceRateLimitMock.mockResolvedValue(false);

    await expect(runSource(validSource, [""])).rejects.toThrow(
      "実行回数の上限に達しました。しばらくしてから再度お試しください",
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  // セッションにメールアドレスがないとき、レート制限のチェックを省略する
  test("should skip the rate limit check when the session has no email", async () => {
    getSessionMock.mockResolvedValue({ accessToken: "token" });
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "run-id" }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ status: "completed" }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            build_stdout: null,
            build_stderr: null,
            stdout: "hello\n",
            stderr: null,
          }),
          { status: 200 },
        ),
      );

    await runSource(validSource, [""]);

    expect(checkRunSourceRateLimitMock).not.toHaveBeenCalled();
  });

  // fixedInputs の件数にかかわらず、レート制限のチェックをちょうど 1 回だけ呼ぶ
  test("should call the rate limit check exactly once regardless of fixedInputs count", async () => {
    getSessionMock.mockResolvedValue(authedSession);
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes("create.json")) {
        return new Response(JSON.stringify({ id: "run-id" }), { status: 200 });
      }
      if (url.includes("get_status.json")) {
        return new Response(JSON.stringify({ status: "completed" }), {
          status: 200,
        });
      }
      return new Response(
        JSON.stringify({
          build_stdout: null,
          build_stderr: null,
          stdout: "ok\n",
          stderr: null,
        }),
        { status: 200 },
      );
    });

    await runSource(validSource, ["a", "b", "c"]);

    expect(checkRunSourceRateLimitMock).toHaveBeenCalledTimes(1);
  });

  // 認証済みで入力が有効なとき、PaizaIO を呼ぶ
  test("should call PaizaIO when authenticated and input is valid", async () => {
    getSessionMock.mockResolvedValue(authedSession);
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "run-id" }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ status: "completed" }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            build_stdout: null,
            build_stderr: null,
            stdout: "hello\n",
            stderr: null,
          }),
          { status: 200 },
        ),
      );

    const result = await runSource(validSource, [""]);

    expect(result).toEqual(["hello\n"]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const createCall = fetchMock.mock.calls[0];
    expect(createCall[0]).toBe("https://api.paiza.io/runners/create.json");
    expect(createCall[1]).toMatchObject({ method: "POST" });
  });
});
