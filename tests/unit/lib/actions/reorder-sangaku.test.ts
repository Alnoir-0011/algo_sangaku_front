import { describe, test, expect, vi, beforeEach } from "vitest";

const { getSessionMock, setFlashMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  setFlashMock: vi.fn(),
}));

vi.mock("@/app/lib/session", () => ({
  getSession: getSessionMock,
}));

vi.mock("@/app/lib/set-flash", () => ({
  setFlash: setFlashMock,
}));

import { createReorderSangaku, updateReorderSangaku } from "@/app/lib/actions/sangaku";

function mockValidationErrorResponse() {
  return new Response(JSON.stringify({ errors: [] }), { status: 400 });
}

// createReorderSangaku（並べ替え問題の作成）
describe("createReorderSangaku", () => {
  beforeEach(() => {
    getSessionMock.mockReset();
    setFlashMock.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  // 呼び出したとき、POST /api/v1/user/reorder_sangakus にリクエストを送る
  test("should send a POST request to /api/v1/user/reorder_sangakus when called", async () => {
    // Arrange
    getSessionMock.mockResolvedValue({ accessToken: "token" });
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(mockValidationErrorResponse());

    const formData = new FormData();
    formData.set("title", "並べ替え問題タイトル");
    const codeBlocks = [
      { content: "puts 1", correct_position: 1 },
      { content: "puts 2", correct_position: null },
    ];

    // Act
    await createReorderSangaku(
      {},
      formData,
      "easy",
      "説明文",
      codeBlocks,
    );

    // Assert
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect((url as string).endsWith("/api/v1/user/reorder_sangakus")).toBe(
      true,
    );
    expect(options).toMatchObject({ method: "POST" });
  });

  // 呼び出したとき、リクエストボディに sangaku と code_blocks が含まれる
  test("should send a request body containing sangaku and code_blocks when called", async () => {
    // Arrange
    getSessionMock.mockResolvedValue({ accessToken: "token" });
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(mockValidationErrorResponse());

    const formData = new FormData();
    formData.set("title", "並べ替え問題タイトル");
    const codeBlocks = [
      { content: "puts 1", correct_position: 1 },
      { content: "puts 2", correct_position: null },
    ];

    // Act
    await createReorderSangaku(
      {},
      formData,
      "easy",
      "説明文",
      codeBlocks,
    );

    // Assert
    const [, options] = fetchMock.mock.calls[0];
    const body = JSON.parse(options.body as string);
    expect(body).toEqual({
      sangaku: {
        title: "並べ替え問題タイトル",
        description: "説明文",
        difficulty: "easy",
      },
      code_blocks: [
        { content: "puts 1", correct_position: 1 },
        { content: "puts 2", correct_position: null },
      ],
    });
  });

  // difficulty が有効な値でないとき、fetch を呼ばない
  test("should not call fetch when difficulty is not a valid value", async () => {
    // Arrange
    getSessionMock.mockResolvedValue({ accessToken: "token" });
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const formData = new FormData();
    formData.set("title", "並べ替え問題タイトル");
    const codeBlocks = [{ content: "puts 1", correct_position: 1 }];

    // Act
    const result = await createReorderSangaku(
      {},
      formData,
      // @ts-expect-error "use server" 経由の直接呼び出しで不正な値が渡るケースを再現する
      "invalid_value",
      "説明文",
      codeBlocks,
    );

    // Assert
    expect(fetchMock).not.toHaveBeenCalled();
    expect(setFlashMock).toHaveBeenCalledWith({
      type: "error",
      message: "リクエストに失敗しました",
    });
    expect(result).toEqual({});
  });

  // codeBlocks が空配列のとき、fetch を呼ばない
  test("should not call fetch when codeBlocks is an empty array", async () => {
    // Arrange
    getSessionMock.mockResolvedValue({ accessToken: "token" });
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const formData = new FormData();
    formData.set("title", "並べ替え問題タイトル");

    // Act
    const result = await createReorderSangaku({}, formData, "easy", "説明文", []);

    // Assert
    expect(fetchMock).not.toHaveBeenCalled();
    expect(setFlashMock).toHaveBeenCalledWith({
      type: "error",
      message: "リクエストに失敗しました",
    });
    expect(result).toEqual({});
  });

  // codeBlocks が最大件数を超えるとき、fetch を呼ばない
  test("should not call fetch when codeBlocks exceeds the maximum count", async () => {
    // Arrange
    getSessionMock.mockResolvedValue({ accessToken: "token" });
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const formData = new FormData();
    formData.set("title", "並べ替え問題タイトル");
    const codeBlocks = Array.from({ length: 101 }, (_, i) => ({
      content: `block_${i}`,
      correct_position: i + 1,
    }));

    // Act
    const result = await createReorderSangaku({}, formData, "easy", "説明文", codeBlocks);

    // Assert
    expect(fetchMock).not.toHaveBeenCalled();
    expect(setFlashMock).toHaveBeenCalledWith({
      type: "error",
      message: "リクエストに失敗しました",
    });
    expect(result).toEqual({});
  });

  // title が文字列でないとき、fetch を呼ばない
  test("should not call fetch when title is not a string", async () => {
    // Arrange
    getSessionMock.mockResolvedValue({ accessToken: "token" });
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const formData = new FormData();
    formData.set("title", new Blob(["file content"]), "title.txt");
    const codeBlocks = [{ content: "puts 1", correct_position: 1 }];

    // Act
    const result = await createReorderSangaku({}, formData, "easy", "説明文", codeBlocks);

    // Assert
    expect(fetchMock).not.toHaveBeenCalled();
    expect(setFlashMock).toHaveBeenCalledWith({
      type: "error",
      message: "リクエストに失敗しました",
    });
    expect(result).toEqual({});
  });

  // title が空のとき、back のフィールドエラーを表示するために fetch を呼ぶ
  test("should call fetch when title is empty so that back's field error is shown", async () => {
    // Arrange: title の空文字チェック（presence）は back のフィールドエラーに委ねる。
    // front で弾いてしまうと serverFetch 自体が呼ばれなくなり、back が返す
    // 「タイトルを入力してください」等のフィールド単位のエラーを表示できなくなる。
    getSessionMock.mockResolvedValue({ accessToken: "token" });
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(mockValidationErrorResponse());
    const formData = new FormData();
    formData.set("title", "");
    const codeBlocks = [{ content: "puts 1", correct_position: 1 }];

    // Act
    await createReorderSangaku({}, formData, "easy", "説明文", codeBlocks);

    // Assert
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  // title が最大長を超えるとき、fetch を呼ばない
  test("should not call fetch when title exceeds the maximum length", async () => {
    // Arrange: back の Sangaku#title の length validator（maximum: 255）と同値
    getSessionMock.mockResolvedValue({ accessToken: "token" });
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const formData = new FormData();
    formData.set("title", "a".repeat(256));
    const codeBlocks = [{ content: "puts 1", correct_position: 1 }];

    // Act
    const result = await createReorderSangaku({}, formData, "easy", "説明文", codeBlocks);

    // Assert
    expect(fetchMock).not.toHaveBeenCalled();
    expect(setFlashMock).toHaveBeenCalledWith({
      type: "error",
      message: "リクエストに失敗しました",
    });
    expect(result).toEqual({});
  });

  // description が最大長を超えるとき、fetch を呼ばない
  test("should not call fetch when description exceeds the maximum length", async () => {
    // Arrange: back の Sangakuable#description の length validator（maximum: 65_535）と同値
    getSessionMock.mockResolvedValue({ accessToken: "token" });
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const formData = new FormData();
    formData.set("title", "並べ替え問題タイトル");
    const codeBlocks = [{ content: "puts 1", correct_position: 1 }];

    // Act
    const result = await createReorderSangaku(
      {},
      formData,
      "easy",
      "a".repeat(65_536),
      codeBlocks,
    );

    // Assert
    expect(fetchMock).not.toHaveBeenCalled();
    expect(setFlashMock).toHaveBeenCalledWith({
      type: "error",
      message: "リクエストに失敗しました",
    });
    expect(result).toEqual({});
  });

  // correct_position が正解ブロック数の最大値を超えるとき、fetch を呼ばない
  test("should not call fetch when correct_position exceeds the maximum block count", async () => {
    // Arrange: correct_position はダミーを除く正解ブロック数（MAX_CODE_BLOCKS）を
    // 超える値を取り得ない
    getSessionMock.mockResolvedValue({ accessToken: "token" });
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const formData = new FormData();
    formData.set("title", "並べ替え問題タイトル");
    const codeBlocks = [{ content: "puts 1", correct_position: 101 }];

    // Act
    const result = await createReorderSangaku({}, formData, "easy", "説明文", codeBlocks);

    // Assert
    expect(fetchMock).not.toHaveBeenCalled();
    expect(setFlashMock).toHaveBeenCalledWith({
      type: "error",
      message: "リクエストに失敗しました",
    });
    expect(result).toEqual({});
  });

  // correct_position が 0 以下のとき、fetch を呼ばない
  test("should not call fetch when correct_position is zero or negative", async () => {
    // Arrange
    getSessionMock.mockResolvedValue({ accessToken: "token" });
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const formData = new FormData();
    formData.set("title", "並べ替え問題タイトル");
    const codeBlocks = [{ content: "puts 1", correct_position: 0 }];

    // Act
    const result = await createReorderSangaku({}, formData, "easy", "説明文", codeBlocks);

    // Assert
    expect(fetchMock).not.toHaveBeenCalled();
    expect(setFlashMock).toHaveBeenCalledWith({
      type: "error",
      message: "リクエストに失敗しました",
    });
    expect(result).toEqual({});
  });
});

// updateReorderSangaku（並べ替え問題の更新）
describe("updateReorderSangaku", () => {
  beforeEach(() => {
    getSessionMock.mockReset();
    setFlashMock.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  // 呼び出したとき、PATCH /api/v1/user/reorder_sangakus/:id にリクエストを送る
  test("should send a PATCH request to /api/v1/user/reorder_sangakus/:id when called", async () => {
    // Arrange
    getSessionMock.mockResolvedValue({ accessToken: "token" });
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(mockValidationErrorResponse());

    const formData = new FormData();
    formData.set("title", "並べ替え問題タイトル");
    const codeBlocks = [
      { content: "puts 1", correct_position: 1 },
      { content: "puts 2", correct_position: null },
    ];

    // Act
    await updateReorderSangaku(
      "1",
      {},
      formData,
      "easy",
      "説明文",
      codeBlocks,
    );

    // Assert
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(
      (url as string).endsWith("/api/v1/user/reorder_sangakus/1"),
    ).toBe(true);
    expect(options).toMatchObject({ method: "PATCH" });
  });

  // 呼び出したとき、リクエストボディに sangaku と code_blocks が含まれる
  test("should send a request body containing sangaku and code_blocks when called", async () => {
    // Arrange
    getSessionMock.mockResolvedValue({ accessToken: "token" });
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(mockValidationErrorResponse());

    const formData = new FormData();
    formData.set("title", "並べ替え問題タイトル");
    const codeBlocks = [
      { content: "puts 1", correct_position: 1 },
      { content: "puts 2", correct_position: null },
    ];

    // Act
    await updateReorderSangaku(
      "1",
      {},
      formData,
      "easy",
      "説明文",
      codeBlocks,
    );

    // Assert
    const [, options] = fetchMock.mock.calls[0];
    const body = JSON.parse(options.body as string);
    expect(body).toEqual({
      sangaku: {
        title: "並べ替え問題タイトル",
        description: "説明文",
        difficulty: "easy",
      },
      code_blocks: [
        { content: "puts 1", correct_position: 1 },
        { content: "puts 2", correct_position: null },
      ],
    });
  });

  // codeBlocks が空配列のとき、fetch を呼ばない
  test("should not call fetch when codeBlocks is an empty array", async () => {
    // Arrange
    getSessionMock.mockResolvedValue({ accessToken: "token" });
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const formData = new FormData();
    formData.set("title", "並べ替え問題タイトル");

    // Act
    const result = await updateReorderSangaku("1", {}, formData, "easy", "説明文", []);

    // Assert
    expect(fetchMock).not.toHaveBeenCalled();
    expect(setFlashMock).toHaveBeenCalledWith({
      type: "error",
      message: "リクエストに失敗しました",
    });
    expect(result).toEqual({});
  });

  // difficulty が有効な値でないとき、fetch を呼ばない
  test("should not call fetch when difficulty is not a valid value", async () => {
    // Arrange
    getSessionMock.mockResolvedValue({ accessToken: "token" });
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const formData = new FormData();
    formData.set("title", "並べ替え問題タイトル");
    const codeBlocks = [
      { content: "puts 1", correct_position: 1 },
      { content: "puts 2", correct_position: 2 },
    ];

    // Act
    const result = await updateReorderSangaku(
      "1",
      {},
      formData,
      // @ts-expect-error "use server" 経由の直接呼び出しで不正な値が渡るケースを再現する
      "invalid_value",
      "説明文",
      codeBlocks,
    );

    // Assert
    expect(fetchMock).not.toHaveBeenCalled();
    expect(setFlashMock).toHaveBeenCalledWith({
      type: "error",
      message: "リクエストに失敗しました",
    });
    expect(result).toEqual({});
  });

  // codeBlocks が最大件数を超えるとき、fetch を呼ばない
  test("should not call fetch when codeBlocks exceeds the maximum count", async () => {
    // Arrange
    getSessionMock.mockResolvedValue({ accessToken: "token" });
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const formData = new FormData();
    formData.set("title", "並べ替え問題タイトル");
    const codeBlocks = Array.from({ length: 101 }, (_, i) => ({
      content: `block_${i}`,
      correct_position: i + 1,
    }));

    // Act
    const result = await updateReorderSangaku(
      "1",
      {},
      formData,
      "easy",
      "説明文",
      codeBlocks,
    );

    // Assert
    expect(fetchMock).not.toHaveBeenCalled();
    expect(setFlashMock).toHaveBeenCalledWith({
      type: "error",
      message: "リクエストに失敗しました",
    });
    expect(result).toEqual({});
  });

  // title が文字列でないとき、fetch を呼ばない
  test("should not call fetch when title is not a string", async () => {
    // Arrange
    getSessionMock.mockResolvedValue({ accessToken: "token" });
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const formData = new FormData();
    formData.set("title", new Blob(["file content"]), "title.txt");
    const codeBlocks = [
      { content: "puts 1", correct_position: 1 },
      { content: "puts 2", correct_position: 2 },
    ];

    // Act
    const result = await updateReorderSangaku(
      "1",
      {},
      formData,
      "easy",
      "説明文",
      codeBlocks,
    );

    // Assert
    expect(fetchMock).not.toHaveBeenCalled();
    expect(setFlashMock).toHaveBeenCalledWith({
      type: "error",
      message: "リクエストに失敗しました",
    });
    expect(result).toEqual({});
  });
});
