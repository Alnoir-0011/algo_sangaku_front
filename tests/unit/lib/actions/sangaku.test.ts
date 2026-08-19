import { describe, test, expect, vi, beforeEach } from "vitest";

const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

import { runSource } from "@/app/lib/actions/sangaku";

const validSource = "puts 'hello'";

describe("runSource", () => {
  beforeEach(() => {
    authMock.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  test("should not call PaizaIO when there is no session", async () => {
    authMock.mockResolvedValue(null);

    await expect(runSource(validSource, [""])).rejects.toThrow(
      "認証が必要です",
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  test("should not call PaizaIO when source is not a string", async () => {
    authMock.mockResolvedValue({ accessToken: "token" });

    // @ts-expect-error 実行時の型迂回を検証するため意図的に不正な型を渡す
    await expect(runSource(["not", "a", "string"], [""])).rejects.toThrow(
      "不正なリクエストです",
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  test("should not call PaizaIO when fixedInputs contains a non-string element", async () => {
    authMock.mockResolvedValue({ accessToken: "token" });

    await expect(
      // @ts-expect-error 実行時の型迂回を検証するため意図的に不正な型を渡す
      runSource(validSource, [["A".repeat(70_000)]]),
    ).rejects.toThrow("不正なリクエストです");
    expect(fetch).not.toHaveBeenCalled();
  });

  test("should not call PaizaIO when fixedInputs has too many elements", async () => {
    authMock.mockResolvedValue({ accessToken: "token" });

    await expect(
      runSource(validSource, Array(21).fill("")),
    ).rejects.toThrow("入力ケースが多すぎます");
    expect(fetch).not.toHaveBeenCalled();
  });

  test("should not call PaizaIO when source is too long", async () => {
    authMock.mockResolvedValue({ accessToken: "token" });

    await expect(
      runSource("a".repeat(65_536), [""]),
    ).rejects.toThrow("入力が長すぎます");
    expect(fetch).not.toHaveBeenCalled();
  });

  test("should not call PaizaIO when a fixed input is too long", async () => {
    authMock.mockResolvedValue({ accessToken: "token" });

    await expect(
      runSource(validSource, ["a".repeat(65_536)]),
    ).rejects.toThrow("入力が長すぎます");
    expect(fetch).not.toHaveBeenCalled();
  });

  test("should call PaizaIO when authenticated and input is valid", async () => {
    authMock.mockResolvedValue({ accessToken: "token" });
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
