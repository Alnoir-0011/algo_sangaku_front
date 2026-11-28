import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";

// fetchShrineSangakus 自体は getSession() を呼ばないが、同一モジュール内の他関数が
// トップレベルで "@/app/lib/session" を import しており、実体（Better Auth と next/headers）を
// 読み込むと vitest の node 環境で解決に失敗するためモックする
vi.mock("@/app/lib/session", () => ({
  getSession: vi.fn(),
}));

import { getSession } from "@/app/lib/session";
import {
  fetchShrineSangakus,
  fetchUserSangakus,
  fetchSavedSangakus,
  fetchUserSangaku,
  fetchSavedSangaku,
  fetchUserSangakuResult,
  fetchPublicReorderSangaku,
  fetchRepresentativeReorderSangaku,
} from "@/app/lib/data/sangaku";

function mockSuccessResponse() {
  return new Response(JSON.stringify({ data: [] }), {
    status: 200,
    headers: { "total-pages": "1" },
  });
}

// fetchShrineSangakus（神社の算額一覧の取得）
describe("fetchShrineSangakus", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  // kind が 'code' のとき、リクエスト URL に kind=code が含まれる
  test("should include kind=code in the request URL when kind is 'code'", async () => {
    // Arrange
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(mockSuccessResponse());

    // Act
    await fetchShrineSangakus("1", "1", "", "", "code");

    // Assert
    const calledUrl = fetchMock.mock.calls[0][0] as string;
    const params = new URLSearchParams(calledUrl.split("?")[1]);
    expect(params.get("kind")).toBe("code");
  });

  // kind が 'reorder' のとき、リクエスト URL に kind=reorder が含まれる
  test("should include kind=reorder in the request URL when kind is 'reorder'", async () => {
    // Arrange
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(mockSuccessResponse());

    // Act
    await fetchShrineSangakus("1", "1", "", "", "reorder");

    // Assert
    const calledUrl = fetchMock.mock.calls[0][0] as string;
    const params = new URLSearchParams(calledUrl.split("?")[1]);
    expect(params.get("kind")).toBe("reorder");
  });

  // kind が省略されたとき、リクエスト URL に kind パラメータが含まれない
  test("should not include a kind parameter in the request URL when kind is omitted", async () => {
    // Arrange
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(mockSuccessResponse());

    // Act
    await fetchShrineSangakus("1", "1", "", "");

    // Assert
    const calledUrl = fetchMock.mock.calls[0][0] as string;
    const params = new URLSearchParams(calledUrl.split("?")[1]);
    expect(params.has("kind")).toBe(false);
  });

  // shrine_id にパストラバーサルの文字が含まれるとき、fetch を呼ばない
  test("should not call fetch when shrine_id contains path traversal characters", async () => {
    // Arrange
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;

    // Act
    const result = await fetchShrineSangakus("../../admin/users", "1", "", "");

    // Assert
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.sangakus).toEqual([]);
  });
});

// fetchUserSangaku（ユーザーの算額の取得）
describe("fetchUserSangaku", () => {
  beforeEach(() => {
    vi.mocked(getSession).mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  // セッションのアクセストークンで、バックエンドが自分を識別できる
  test("should allow the backend to know who I am with the access token of my session", async () => {
    // Arrange
    vi.mocked(getSession).mockResolvedValue({ accessToken: "my-token" } as never);
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(mockSuccessResponse());

    // Act
    await fetchUserSangaku("1");

    // Assert
    const options = fetchMock.mock.calls[0][1] as {
      headers: Record<string, string>;
    };
    expect(options.headers["Authorization"]).toBe("Bearer my-token");
  });

  // id が有効な id のとき、期待する URL で fetch を呼ぶ
  test("should call fetch with the expected URL when id is a valid id", async () => {
    // Arrange
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(mockSuccessResponse());

    // Act
    await fetchUserSangaku("1");

    // Assert
    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl.endsWith("/api/v1/user/sangakus/1")).toBe(true);
  });

  // id にパストラバーサルの文字が含まれるとき、fetch を呼ばない
  test("should not call fetch when id contains path traversal characters", async () => {
    // Arrange
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;

    // Act
    const result = await fetchUserSangaku("../../admin/users");

    // Assert
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });
});

// fetchSavedSangaku（保存した算額の取得）
describe("fetchSavedSangaku", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  // id が有効な id のとき、期待する URL で fetch を呼ぶ
  test("should call fetch with the expected URL when id is a valid id", async () => {
    // Arrange
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(mockSuccessResponse());

    // Act
    await fetchSavedSangaku("1");

    // Assert
    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl.includes("/api/v1/user/saved_sangakus/1")).toBe(true);
  });

  // id にパストラバーサルの文字が含まれるとき、fetch を呼ばない
  test("should not call fetch when id contains path traversal characters", async () => {
    // Arrange
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;

    // Act
    const result = await fetchSavedSangaku("../../admin/users");

    // Assert
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });
});

// fetchUserSangakuResult（ユーザーの算額の結果の取得）
describe("fetchUserSangakuResult", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  // id が有効な id のとき、期待する URL で fetch を呼ぶ
  test("should call fetch with the expected URL when id is a valid id", async () => {
    // Arrange
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(mockSuccessResponse());

    // Act
    await fetchUserSangakuResult("1");

    // Assert
    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl.includes("/api/v1/user/sangakus/1/result")).toBe(true);
  });

  // id にパストラバーサルの文字が含まれるとき、fetch を呼ばない
  test("should not call fetch when id contains path traversal characters", async () => {
    // Arrange
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;

    // Act
    const result = await fetchUserSangakuResult("../../admin/users");

    // Assert
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });
});

// fetchUserSangakus（ユーザーの算額一覧の取得）
describe("fetchUserSangakus", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // kind が 'code' のとき、リクエスト URL に kind=code が含まれる
  test("should include kind=code in the request URL when kind is 'code'", async () => {
    // Arrange
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(mockSuccessResponse());

    // Act
    await fetchUserSangakus("1", "", "", "code");

    // Assert
    const calledUrl = fetchMock.mock.calls[0][0] as string;
    const params = new URLSearchParams(calledUrl.split("?")[1]);
    expect(params.get("kind")).toBe("code");
  });

  // kind が 'reorder' のとき、リクエスト URL に kind=reorder が含まれる
  test("should include kind=reorder in the request URL when kind is 'reorder'", async () => {
    // Arrange
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(mockSuccessResponse());

    // Act
    await fetchUserSangakus("1", "", "", "reorder");

    // Assert
    const calledUrl = fetchMock.mock.calls[0][0] as string;
    const params = new URLSearchParams(calledUrl.split("?")[1]);
    expect(params.get("kind")).toBe("reorder");
  });

  // kind が省略されたとき、リクエスト URL に kind パラメータが含まれない
  test("should not include a kind parameter in the request URL when kind is omitted", async () => {
    // Arrange
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(mockSuccessResponse());

    // Act
    await fetchUserSangakus("1", "", "");

    // Assert
    const calledUrl = fetchMock.mock.calls[0][0] as string;
    const params = new URLSearchParams(calledUrl.split("?")[1]);
    expect(params.has("kind")).toBe(false);
  });

  // セッションを読み取れないとき、予期せぬエラーのメッセージを返す
  test("should return an unexpected error message when the session cannot be read", async () => {
    // Arrange
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const sessionError = new Error("session decode failed");
    vi.mocked(getSession).mockRejectedValueOnce(sessionError);
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    // Act
    const result = await fetchUserSangakus("1", "", "");

    // Assert
    expect(result).toEqual({
      sangakus: [],
      totalPage: 0,
      message: "予期せぬエラーが発生しました",
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("fetchUserSangakus"),
      sessionError,
    );
  });

  // レスポンスのステータスが 401 のとき、セッション切れのメッセージを返す
  test("should return a session expired message when the response status is 401", async () => {
    // Arrange
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));

    // Act
    const result = await fetchUserSangakus("1", "", "");

    // Assert
    expect(result.sangakus).toEqual([]);
    expect(result.totalPage).toBe(0);
    expect(result.message).toContain("セッションの有効期限が切れています");
  });

  // レスポンスのステータスが 500 のとき、リクエスト失敗のメッセージを返す
  test("should return a request failed message when the response status is 500", async () => {
    // Arrange
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 500 }));

    // Act
    const result = await fetchUserSangakus("1", "", "");

    // Assert
    expect(result).toEqual({
      sangakus: [],
      totalPage: 0,
      message: "リクエストに失敗しました",
    });
  });

  // リクエスト自体が失敗したとき、予期せぬエラーのメッセージを返す
  test("should return an unexpected error message when the request itself fails", async () => {
    // Arrange
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    // Act
    const result = await fetchUserSangakus("1", "", "");

    // Assert
    expect(result).toEqual({
      sangakus: [],
      totalPage: 0,
      message: "予期せぬエラーが発生しました",
    });
  });

  // リダイレクトエラーは、メッセージを返さずに再スローする
  test("should rethrow a redirect error instead of returning a message", async () => {
    // Arrange
    // Next.js の redirect() が投げるエラーの digest 形式
    const redirectError = Object.assign(new Error("NEXT_REDIRECT"), {
      digest: "NEXT_REDIRECT;replace;/signin;307;",
    });
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockRejectedValueOnce(redirectError);

    // Act & Assert
    await expect(fetchUserSangakus("1", "", "")).rejects.toBe(redirectError);
  });

  // page に %j を指定したとき、page=%j でリクエストする
  test.each([
    ["abc", "1"],
    ["0", "1"],
    ["-1", "1"],
    ["1.5", "1"],
    ["", "1"],
    ["1,2", "1"],
    ["3", "3"],
    ["10", "10"],
  ])(
    "should request page=%j as page=%j",
    async (page, expectedPage) => {
      // Arrange
      const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
      fetchMock.mockResolvedValueOnce(mockSuccessResponse());

      // Act
      await fetchUserSangakus(page, "", "");

      // Assert
      const calledUrl = fetchMock.mock.calls[0][0] as string;
      const params = new URLSearchParams(calledUrl.split("?")[1]);
      expect(params.get("page")).toBe(expectedPage);
    },
  );

  // query が文字列のとき、リクエスト URL に title パラメータが含まれる
  test("should include the title parameter in the request URL when query is a string", async () => {
    // Arrange
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(mockSuccessResponse());

    // Act
    await fetchUserSangakus("1", "foo", "");

    // Assert
    const calledUrl = fetchMock.mock.calls[0][0] as string;
    const params = new URLSearchParams(calledUrl.split("?")[1]);
    expect(params.get("title")).toBe("foo");
  });

  // query が文字列でないとき、title パラメータが含まれない
  test("should not include a title parameter when query is not a string", async () => {
    // Arrange
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(mockSuccessResponse());

    // Act
    // ?query=a&query=b のとき searchParams.query は実行時に配列になる
    await fetchUserSangakus("1", ["a", "b"] as unknown as string, "");

    // Assert
    const calledUrl = fetchMock.mock.calls[0][0] as string;
    const params = new URLSearchParams(calledUrl.split("?")[1]);
    expect(params.has("title")).toBe(false);
  });
});

// fetchSavedSangakus（保存した算額一覧の取得）
describe("fetchSavedSangakus", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  // kind が 'code' のとき、リクエスト URL に kind=code が含まれる
  test("should include kind=code in the request URL when kind is 'code'", async () => {
    // Arrange
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(mockSuccessResponse());

    // Act
    await fetchSavedSangakus("1", "", "", undefined, "code");

    // Assert
    const calledUrl = fetchMock.mock.calls[0][0] as string;
    const params = new URLSearchParams(calledUrl.split("?")[1]);
    expect(params.get("kind")).toBe("code");
  });

  // kind が 'reorder' のとき、リクエスト URL に kind=reorder が含まれる
  test("should include kind=reorder in the request URL when kind is 'reorder'", async () => {
    // Arrange
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(mockSuccessResponse());

    // Act
    await fetchSavedSangakus("1", "", "", undefined, "reorder");

    // Assert
    const calledUrl = fetchMock.mock.calls[0][0] as string;
    const params = new URLSearchParams(calledUrl.split("?")[1]);
    expect(params.get("kind")).toBe("reorder");
  });

  // kind が省略されたとき、リクエスト URL に kind パラメータが含まれない
  test("should not include a kind parameter in the request URL when kind is omitted", async () => {
    // Arrange
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(mockSuccessResponse());

    // Act
    await fetchSavedSangakus("1", "", "");

    // Assert
    const calledUrl = fetchMock.mock.calls[0][0] as string;
    const params = new URLSearchParams(calledUrl.split("?")[1]);
    expect(params.has("kind")).toBe(false);
  });

  // type と kind の両方を指定したとき、リクエスト URL に両方が含まれる
  test("should include both type and kind in the request URL when both are specified", async () => {
    // Arrange
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(mockSuccessResponse());

    // Act
    await fetchSavedSangakus("1", "", "", "answered", "reorder");

    // Assert
    const calledUrl = fetchMock.mock.calls[0][0] as string;
    const params = new URLSearchParams(calledUrl.split("?")[1]);
    expect(params.get("type")).toBe("answered");
    expect(params.get("kind")).toBe("reorder");
  });
});

// fetchPublicReorderSangaku（公開された並べ替え問題の取得）
describe("fetchPublicReorderSangaku", () => {
  beforeEach(() => {
    vi.mocked(getSession).mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  // ステータスが 200 のとき、レスポンスのデータを返す
  test("should return the data of the response when the status is 200", async () => {
    // Arrange
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const sangaku = { id: "1", type: "reorder_sangaku" };
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ data: sangaku }), { status: 200 }),
    );

    // Act
    const result = await fetchPublicReorderSangaku("1");

    // Assert
    expect(result).toEqual(sangaku);
  });

  // ステータスが 404 のとき、null を返す
  test("should return null when the status is 404", async () => {
    // Arrange
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 404 }));

    // Act
    const result = await fetchPublicReorderSangaku("1");

    // Assert
    expect(result).toBeNull();
  });

  // id にパストラバーサルの文字が含まれるとき、fetch を呼ばずに null を返す
  test("should not call fetch and return null when id contains path traversal characters", async () => {
    // Arrange
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;

    // Act
    const result = await fetchPublicReorderSangaku("../../admin/users");

    // Assert
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  // ステータスが 500 のとき、例外を投げる
  test("should throw when the status is 500", async () => {
    // Arrange
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 500 }));

    // Act & Assert
    await expect(fetchPublicReorderSangaku("1")).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  // fetch が reject されたとき、例外を投げる
  test("should throw when fetch rejects", async () => {
    // Arrange
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockRejectedValueOnce(new Error("network error"));

    // Act & Assert
    await expect(fetchPublicReorderSangaku("1")).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  // id が有効な id のとき、公開された並べ替え問題の URL で fetch を呼ぶ
  test("should call fetch with the public reorder sangaku URL when id is a valid id", async () => {
    // Arrange
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ data: {} }), { status: 200 }),
    );

    // Act
    await fetchPublicReorderSangaku("1");

    // Assert
    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl.endsWith("/api/v1/public/reorder_sangakus/1")).toBe(true);
  });

  // サインイン中でも、公開 API には ApiKey を送らない。session が token を持つ状態で確かめる
  // サインイン中でも、取得時に Authorization ヘッダーを送らない
  test("should not send an Authorization header when fetching even if I am signed in", async () => {
    // Arrange
    vi.mocked(getSession).mockResolvedValue({ accessToken: "my-token" } as never);
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ data: {} }), { status: 200 }),
    );

    // Act
    await fetchPublicReorderSangaku("1");

    // Assert
    const options = fetchMock.mock.calls[0][1] as
      | { headers?: Record<string, string> }
      | undefined;
    expect(options?.headers ?? {}).not.toHaveProperty("Authorization");
  });
});

// fetchRepresentativeReorderSangaku（代表の並べ替え問題の取得）
describe("fetchRepresentativeReorderSangaku", () => {
  beforeEach(() => {
    vi.mocked(getSession).mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  // ステータスが 200 のとき、レスポンスのデータを返す
  test("should return the data of the response when the status is 200", async () => {
    // Arrange
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const sangaku = { id: "1", type: "reorder_sangaku" };
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ data: sangaku }), { status: 200 }),
    );

    // Act
    const result = await fetchRepresentativeReorderSangaku("1");

    // Assert
    expect(result).toEqual(sangaku);
  });

  // ステータスが 404 のとき、null を返す
  test("should return null when the status is 404", async () => {
    // Arrange
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 404 }));

    // Act
    const result = await fetchRepresentativeReorderSangaku("1");

    // Assert
    expect(result).toBeNull();
  });

  // shrineId にパストラバーサルの文字が含まれるとき、fetch を呼ばずに null を返す
  test("should not call fetch and return null when shrineId contains path traversal characters", async () => {
    // Arrange
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;

    // Act
    const result = await fetchRepresentativeReorderSangaku("../../admin/users");

    // Assert
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  // ステータスが 500 のとき、例外を投げずに null を返す
  test("should return null without throwing when the status is 500", async () => {
    // Arrange
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 500 }));

    // Act
    const result = await fetchRepresentativeReorderSangaku("1");

    // Assert
    expect(result).toBeNull();
  });

  // fetch が reject されたとき、例外を投げずに null を返す
  test("should return null without throwing when fetch rejects", async () => {
    // Arrange
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockRejectedValueOnce(new Error("network error"));

    // Act
    const result = await fetchRepresentativeReorderSangaku("1");

    // Assert
    expect(result).toBeNull();
  });

  // shrineId が有効な id のとき、代表の並べ替え問題の URL で fetch を呼ぶ
  test("should call fetch with the representative reorder sangaku URL when shrineId is a valid id", async () => {
    // Arrange
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ data: {} }), { status: 200 }),
    );

    // Act
    await fetchRepresentativeReorderSangaku("1");

    // Assert
    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(
      calledUrl.endsWith(
        "/api/v1/public/shrines/1/representative_reorder_sangaku",
      ),
    ).toBe(true);
  });

  // サインイン中でも、公開 API には ApiKey を送らない。session が token を持つ状態で確かめる
  // サインイン中でも、取得時に Authorization ヘッダーを送らない
  test("should not send an Authorization header when fetching even if I am signed in", async () => {
    // Arrange
    vi.mocked(getSession).mockResolvedValue({ accessToken: "my-token" } as never);
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ data: {} }), { status: 200 }),
    );

    // Act
    await fetchRepresentativeReorderSangaku("1");

    // Assert
    const options = fetchMock.mock.calls[0][1] as
      | { headers?: Record<string, string> }
      | undefined;
    expect(options?.headers ?? {}).not.toHaveProperty("Authorization");
  });
});
