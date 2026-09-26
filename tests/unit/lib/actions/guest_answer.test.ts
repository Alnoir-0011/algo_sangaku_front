import { describe, test, expect, vi, beforeEach } from "vitest";

const { authMock, setFlashMock, redirectMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  setFlashMock: vi.fn(),
  redirectMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/app/lib/actions/flash", () => ({
  setFlash: setFlashMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

import { submitGuestReorderAnswer } from "@/app/lib/actions/guest_answer";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

function getFetchMock() {
  return fetch as unknown as ReturnType<typeof vi.fn>;
}

describe("submitGuestReorderAnswer", () => {
  beforeEach(() => {
    authMock.mockReset();
    setFlashMock.mockReset();
    redirectMock.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  test("should return { status: 'correct' } when back responds 200 with status correct", async () => {
    // Arrange
    getFetchMock().mockResolvedValueOnce(jsonResponse({ status: "correct" }));

    // Act
    const result = await submitGuestReorderAnswer("1", [1, 2, 3]);

    // Assert
    expect(result).toEqual({ status: "correct" });
  });

  test("should return { status: 'incorrect' } when back responds 200 with status incorrect", async () => {
    // Arrange
    getFetchMock().mockResolvedValueOnce(jsonResponse({ status: "incorrect" }));

    // Act
    const result = await submitGuestReorderAnswer("1", [1, 2, 3]);

    // Assert
    expect(result).toEqual({ status: "incorrect" });
  });

  test("should return { error } when back responds 200 without status", async () => {
    // Arrange
    getFetchMock().mockResolvedValueOnce(jsonResponse({}));

    // Act
    const result = await submitGuestReorderAnswer("1", [1, 2, 3]);

    // Assert
    expect(result).toHaveProperty("error");
    expect(result).not.toHaveProperty("status");
  });

  test("should return { error } when back responds 200 with an unexpected status value", async () => {
    // Arrange
    getFetchMock().mockResolvedValueOnce(jsonResponse({ status: "pending" }));

    // Act
    const result = await submitGuestReorderAnswer("1", [1, 2, 3]);

    // Assert
    expect(result).toHaveProperty("error");
    expect(result).not.toHaveProperty("status");
  });

  test("should send a POST request to /api/v1/public/reorder_sangakus/:id/answer when called with valid input", async () => {
    // Arrange
    const fetchMock = getFetchMock();
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: "correct" }));

    // Act
    await submitGuestReorderAnswer("12", [1, 2, 3]);

    // Assert
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(
      (url as string).endsWith("/api/v1/public/reorder_sangakus/12/answer"),
    ).toBe(true);
    expect(options).toMatchObject({ method: "POST" });
  });

  test("should send a request body of { answer: { block_ids } } when called with valid input", async () => {
    // Arrange
    const fetchMock = getFetchMock();
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: "correct" }));

    // Act
    await submitGuestReorderAnswer("1", [3, 1, 2]);

    // Assert
    const [, options] = fetchMock.mock.calls[0];
    expect(JSON.parse(options.body as string)).toEqual({
      answer: { block_ids: [3, 1, 2] },
    });
  });

  test("should not send an Authorization header when called with valid input", async () => {
    // Arrange
    const fetchMock = getFetchMock();
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: "correct" }));

    // Act
    await submitGuestReorderAnswer("1", [1, 2, 3]);

    // Assert
    const [, options] = fetchMock.mock.calls[0];
    const headers = new Headers(
      (options as { headers?: Record<string, string> }).headers,
    );
    expect(headers.has("Authorization")).toBe(false);
  });

  test("should send a request when blockIds has exactly 100 elements", async () => {
    // Arrange
    const fetchMock = getFetchMock();
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: "correct" }));
    const ids = Array.from({ length: 100 }, (_, i) => i + 1);

    // Act
    const result = await submitGuestReorderAnswer("1", ids);

    // Assert
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ status: "correct" });
  });

  const invalidCases: Array<[string, string, number[]]> = [
    ["sangakuId contains non-digit characters", "1a", [1, 2]],
    ["sangakuId is an empty string", "", [1, 2]],
    ["sangakuId contains a path traversal", "1/../2", [1, 2]],
    ["blockIds is an empty array", "1", []],
    [
      "blockIds has 101 elements",
      "1",
      Array.from({ length: 101 }, (_, i) => i + 1),
    ],
    ["blockIds contains a non-integer number", "1", [1, 1.5, 3]],
    ["blockIds contains 0", "1", [0, 1, 2]],
    ["blockIds contains a negative number", "1", [1, -2, 3]],
    ["blockIds contains a non-number value", "1", [1, "2" as unknown as number]],
    ["blockIds contains duplicates", "1", [1, 2, 2]],
  ];

  test.each(invalidCases)(
    "should return { error } without calling fetch when %s",
    async (_name, sangakuId, blockIds) => {
      // Arrange
      const fetchMock = getFetchMock();

      // Act
      const result = await submitGuestReorderAnswer(sangakuId, blockIds);

      // Assert
      expect(fetchMock).not.toHaveBeenCalled();
      expect(result).toHaveProperty("error");
    },
  );

  test.each([400, 404, 500])(
    "should return { error } without throwing when back responds %i",
    async (status) => {
      // Arrange
      getFetchMock().mockResolvedValueOnce(jsonResponse({ errors: [] }, status));

      // Act
      const result = await submitGuestReorderAnswer("1", [1, 2, 3]);

      // Assert
      expect(result).toHaveProperty("error");
    },
  );

  test("should return { error } without throwing when fetch rejects", async () => {
    // Arrange
    getFetchMock().mockRejectedValueOnce(new Error("network error"));

    // Act
    const result = await submitGuestReorderAnswer("1", [1, 2, 3]);

    // Assert
    expect(result).toHaveProperty("error");
  });

  test("should not call auth, setFlash, or redirect when called with valid input", async () => {
    // Arrange
    getFetchMock().mockResolvedValueOnce(jsonResponse({ status: "correct" }));

    // Act
    await submitGuestReorderAnswer("1", [1, 2, 3]);

    // Assert
    expect(authMock).not.toHaveBeenCalled();
    expect(setFlashMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
