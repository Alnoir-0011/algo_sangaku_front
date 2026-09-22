import { describe, test, expect, vi, beforeEach } from "vitest";

const { authMock, setFlashMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  setFlashMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/app/lib/actions/flash", () => ({
  setFlash: setFlashMock,
}));

import { createAnswer } from "@/app/lib/actions/answer";

function mockValidationErrorResponse() {
  return new Response(JSON.stringify({ errors: [] }), { status: 400 });
}

describe("createAnswer", () => {
  beforeEach(() => {
    authMock.mockReset();
    setFlashMock.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  test("should send a POST request to /api/v1/user/saved_sangakus/:id/answer when called with a source payload", async () => {
    // Arrange
    authMock.mockResolvedValue({ accessToken: "token" });
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(mockValidationErrorResponse());

    // Act
    await createAnswer("1", { source: "puts 1" });

    // Assert
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(
      (url as string).endsWith("/api/v1/user/saved_sangakus/1/answer"),
    ).toBe(true);
    expect(options).toMatchObject({ method: "POST" });
  });

  test("should send a request body containing answer.source when called with a source payload", async () => {
    // Arrange
    authMock.mockResolvedValue({ accessToken: "token" });
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(mockValidationErrorResponse());

    // Act
    await createAnswer("1", { source: "puts 1" });

    // Assert
    const [, options] = fetchMock.mock.calls[0];
    const body = JSON.parse(options.body as string);
    expect(body).toEqual({
      answer: {
        source: "puts 1",
      },
    });
  });

  test("should send a request body containing answer.block_ids when called with a block_ids payload", async () => {
    // Arrange
    authMock.mockResolvedValue({ accessToken: "token" });
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(mockValidationErrorResponse());

    // Act
    await createAnswer("1", { block_ids: [3, 1, 2] });

    // Assert
    const [, options] = fetchMock.mock.calls[0];
    const body = JSON.parse(options.body as string);
    expect(body).toEqual({
      answer: {
        block_ids: [3, 1, 2],
      },
    });
  });

  test("should not call fetch when block_ids contains a non-integer element", async () => {
    // Arrange
    authMock.mockResolvedValue({ accessToken: "token" });
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;

    // Act
    // @ts-expect-error "use server" 経由の直接呼び出しで不正な値が渡るケースを再現する
    const result = await createAnswer("1", { block_ids: [1, "not-a-number", 3] });

    // Assert
    expect(fetchMock).not.toHaveBeenCalled();
    expect(setFlashMock).toHaveBeenCalledWith({
      type: "error",
      message: "リクエストに失敗しました",
    });
    expect(result).toEqual({ message: "リクエストに失敗しました" });
  });

  test("should not call fetch when block_ids is an empty array", async () => {
    // Arrange
    authMock.mockResolvedValue({ accessToken: "token" });
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;

    // Act
    const result = await createAnswer("1", { block_ids: [] });

    // Assert
    expect(fetchMock).not.toHaveBeenCalled();
    expect(setFlashMock).toHaveBeenCalledWith({
      type: "error",
      message: "リクエストに失敗しました",
    });
    expect(result).toEqual({ message: "リクエストに失敗しました" });
  });

  test("should not call fetch when payload has neither source nor block_ids", async () => {
    // Arrange
    authMock.mockResolvedValue({ accessToken: "token" });
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;

    // Act
    // @ts-expect-error "use server" 経由の直接呼び出しで不正な値が渡るケースを再現する
    const result = await createAnswer("1", { foo: "bar" });

    // Assert
    expect(fetchMock).not.toHaveBeenCalled();
    expect(setFlashMock).toHaveBeenCalledWith({
      type: "error",
      message: "リクエストに失敗しました",
    });
    expect(result).toEqual({ message: "リクエストに失敗しました" });
  });

  test("should not call fetch when source is not a string", async () => {
    // Arrange
    authMock.mockResolvedValue({ accessToken: "token" });
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;

    // Act
    // @ts-expect-error "use server" 経由の直接呼び出しで不正な値が渡るケースを再現する
    const result = await createAnswer("1", { source: 12345 });

    // Assert
    expect(fetchMock).not.toHaveBeenCalled();
    expect(setFlashMock).toHaveBeenCalledWith({
      type: "error",
      message: "リクエストに失敗しました",
    });
    expect(result).toEqual({ message: "リクエストに失敗しました" });
  });

  test("should send only the source field when the payload contains both source and block_ids", async () => {
    // Arrange
    // "use server" 経由の直接呼び出しでは union 型の排他性を実行時には保証できないため、
    // source と block_ids の両方を含むオブジェクトが渡りうる。判定に使った source 側の
    // フィールドだけが転送され、未検証の block_ids が素通りしないことを確認する。
    authMock.mockResolvedValue({ accessToken: "token" });
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(mockValidationErrorResponse());

    // Act
    // source を含むオブジェクトリテラルは AnswerPayload の union 判定上
    // block_ids を余分なプロパティとして問題なく持てるため、型エラーにはならない
    await createAnswer("1", { source: "puts 1", block_ids: [1, 2, 3] });

    // Assert
    const [, options] = fetchMock.mock.calls[0];
    const body = JSON.parse(options.body as string);
    expect(body).toEqual({ answer: { source: "puts 1" } });
  });

  test("should not call fetch when block_ids contains a duplicate id", async () => {
    // Arrange
    authMock.mockResolvedValue({ accessToken: "token" });
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;

    // Act
    const result = await createAnswer("1", { block_ids: [1, 2, 2] });

    // Assert
    expect(fetchMock).not.toHaveBeenCalled();
    expect(setFlashMock).toHaveBeenCalledWith({
      type: "error",
      message: "リクエストに失敗しました",
    });
    expect(result).toEqual({ message: "リクエストに失敗しました" });
  });

  test("should not call fetch when block_ids contains a non-positive id", async () => {
    // Arrange
    authMock.mockResolvedValue({ accessToken: "token" });
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;

    // Act
    const result = await createAnswer("1", { block_ids: [1, 0, 3] });

    // Assert
    expect(fetchMock).not.toHaveBeenCalled();
    expect(setFlashMock).toHaveBeenCalledWith({
      type: "error",
      message: "リクエストに失敗しました",
    });
    expect(result).toEqual({ message: "リクエストに失敗しました" });
  });
});
