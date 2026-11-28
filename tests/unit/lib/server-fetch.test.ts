import { describe, test, expect, vi, beforeEach } from "vitest";
import { serverFetch } from "@/app/lib/server-fetch";
import { DEFAULT_NETWORK_TIMEOUT_MS } from "@/app/lib/constants";

function mockSuccessResponse() {
  return new Response(null, { status: 200 });
}

// serverFetch（サーバー側の fetch）
describe("serverFetch", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockSuccessResponse()));
  });

  // 呼び出し元が signal を渡さないとき、デフォルトの AbortSignal を付ける
  test("should attach a default AbortSignal when the caller passes no signal", async () => {
    await serverFetch("https://example.com/api");

    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const options = fetchMock.mock.calls[0][1];
    expect(options.signal).toBeInstanceOf(AbortSignal);
    expect(options.signal.aborted).toBe(false);
  });

  // timeoutMs を指定したとき、デフォルトの代わりにその値を使う
  test("should use the given timeoutMs instead of the default", async () => {
    const timeoutSpy = vi.spyOn(AbortSignal, "timeout");

    await serverFetch("https://example.com/api", { timeoutMs: 30_000 });

    expect(timeoutSpy).toHaveBeenCalledWith(30_000);
    timeoutSpy.mockRestore();
  });

  // timeoutMs が指定されないとき、DEFAULT_NETWORK_TIMEOUT_MS を使う
  test("should use DEFAULT_NETWORK_TIMEOUT_MS when timeoutMs is not given", async () => {
    const timeoutSpy = vi.spyOn(AbortSignal, "timeout");

    await serverFetch("https://example.com/api");

    expect(timeoutSpy).toHaveBeenCalledWith(DEFAULT_NETWORK_TIMEOUT_MS);
    timeoutSpy.mockRestore();
  });

  // タイムアウト用の signal も付いていても、呼び出し元の signal が abort されたときは中断する
  test("should still abort when the caller's own signal aborts, even though a timeout signal is also attached", async () => {
    const controller = new AbortController();

    await serverFetch("https://example.com/api", { signal: controller.signal });
    controller.abort();

    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const options = fetchMock.mock.calls[0][1];
    expect(options.signal.aborted).toBe(true);
  });

  // 呼び出し元が自前の signal を渡しても、デフォルトのタイムアウト保護を黙って外さない
  test("should not silently drop the default timeout protection when the caller passes its own signal", async () => {
    const controller = new AbortController();

    await serverFetch("https://example.com/api", { signal: controller.signal });

    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const options = fetchMock.mock.calls[0][1];
    // caller の signal をそのまま使い回すだけの実装(旧: signal ?? AbortSignal.timeout(...))
    // だと、ここが caller の signal と同一になりタイムアウト保護が失われる
    expect(options.signal).not.toBe(controller.signal);
  });
});
