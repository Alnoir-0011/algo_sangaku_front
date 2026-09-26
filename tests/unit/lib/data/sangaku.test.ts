import { describe, test, expect, vi, beforeEach } from "vitest";

// fetchShrineSangakus 自体は auth() を呼ばないが、同一モジュール内の他関数が
// トップレベルで "@/auth" を import しており、実体（next-auth）を読み込むと
// vitest の node 環境で next/server の解決に失敗するためモックする
vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

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

describe("fetchShrineSangakus", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

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

describe("fetchUserSangaku", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

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

describe("fetchSavedSangaku", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

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

describe("fetchUserSangakuResult", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

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

describe("fetchUserSangakus", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

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
});

describe("fetchSavedSangakus", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

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

describe("fetchPublicReorderSangaku", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

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

  test("should return null when the status is 404", async () => {
    // Arrange
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 404 }));

    // Act
    const result = await fetchPublicReorderSangaku("1");

    // Assert
    expect(result).toBeNull();
  });

  test("should not call fetch and return null when id contains path traversal characters", async () => {
    // Arrange
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;

    // Act
    const result = await fetchPublicReorderSangaku("../../admin/users");

    // Assert
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  test("should throw when the status is 500", async () => {
    // Arrange
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 500 }));

    // Act & Assert
    await expect(fetchPublicReorderSangaku("1")).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("should throw when fetch rejects", async () => {
    // Arrange
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockRejectedValueOnce(new Error("network error"));

    // Act & Assert
    await expect(fetchPublicReorderSangaku("1")).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

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

  test("should not send an Authorization header when fetching", async () => {
    // Arrange
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

describe("fetchRepresentativeReorderSangaku", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

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

  test("should return null when the status is 404", async () => {
    // Arrange
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 404 }));

    // Act
    const result = await fetchRepresentativeReorderSangaku("1");

    // Assert
    expect(result).toBeNull();
  });

  test("should not call fetch and return null when shrineId contains path traversal characters", async () => {
    // Arrange
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;

    // Act
    const result = await fetchRepresentativeReorderSangaku("../../admin/users");

    // Assert
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  test("should return null without throwing when the status is 500", async () => {
    // Arrange
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 500 }));

    // Act
    const result = await fetchRepresentativeReorderSangaku("1");

    // Assert
    expect(result).toBeNull();
  });

  test("should return null without throwing when fetch rejects", async () => {
    // Arrange
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockRejectedValueOnce(new Error("network error"));

    // Act
    const result = await fetchRepresentativeReorderSangaku("1");

    // Assert
    expect(result).toBeNull();
  });

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

  test("should not send an Authorization header when fetching", async () => {
    // Arrange
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
