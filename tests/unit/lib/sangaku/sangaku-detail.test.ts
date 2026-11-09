import { describe, test, expect, vi, beforeEach } from "vitest";
import type { Sangaku, SangakuResult, Shrine } from "@/app/lib/definitions";

// 取得関数は "use server" ファイルの Server Action で、実体を読み込むと next-auth を
// 読み込んでしまうため、差し替える。
vi.mock("@/app/lib/data/sangaku", () => ({
  fetchUserSangaku: vi.fn(),
  fetchUserSangakuResult: vi.fn(),
}));
vi.mock("@/app/lib/data/shrine", () => ({
  fetchShrine: vi.fn(),
}));

import { fetchShrine } from "@/app/lib/data/shrine";
import {
  fetchUserSangaku,
  fetchUserSangakuResult,
} from "@/app/lib/data/sangaku";
import {
  fetchReorderDetail,
  fetchSangakuModalDetail,
  SessionExpiredError,
} from "@/app/lib/sangaku/sangaku-detail";

const buildSangaku = (shrineId: string | null): Sangaku => ({
  id: "1",
  type: "sangaku",
  attributes: {
    title: "title_1",
    description: "description_1",
    source: "puts 'hi'",
    difficulty: "normal",
    kind: "code",
    inputs: [],
    author_name: "test_author",
  },
  relationships: {
    user: { data: { id: "1", type: "user" } },
    shrine: { data: shrineId ? { id: shrineId, type: "shrine" } : null },
  },
});

const shrine = { id: "10", type: "shrine" } as Shrine;
const result = {
  attributes: { user_sangaku_save_count: 5, correct_count: 3, incorrect_count: 2 },
} as SangakuResult;

beforeEach(() => {
  vi.resetAllMocks();
});

describe("fetchSangakuModalDetail", () => {
  test("should resolve with the shrine and the result when both are fetched", async () => {
    vi.mocked(fetchShrine).mockResolvedValue(shrine);
    vi.mocked(fetchUserSangakuResult).mockResolvedValue(result);

    await expect(fetchSangakuModalDetail(buildSangaku("10"))).resolves.toEqual({
      shrine,
      result,
    });
    expect(fetchShrine).toHaveBeenCalledWith("10");
    expect(fetchUserSangakuResult).toHaveBeenCalledWith("1");
  });

  test("should not fetch a shrine when the sangaku has no shrine", async () => {
    vi.mocked(fetchUserSangakuResult).mockResolvedValue(result);

    await expect(fetchSangakuModalDetail(buildSangaku(null))).resolves.toEqual({
      shrine: null,
      result,
    });
    expect(fetchShrine).not.toHaveBeenCalled();
  });

  // fetchShrine は 404 も通信失敗もすべて null を返し、区別できない。例外にすると、
  // 神社が削除された算額のモーダルが開けなくなるため、神社名を出さずに開く。
  test("should resolve with a null shrine when the shrine cannot be fetched", async () => {
    vi.mocked(fetchShrine).mockResolvedValue(null);
    vi.mocked(fetchUserSangakuResult).mockResolvedValue(result);

    await expect(fetchSangakuModalDetail(buildSangaku("10"))).resolves.toEqual({
      shrine: null,
      result,
    });
  });

  test("should reject with an error that includes the sangaku id when the result cannot be fetched", async () => {
    vi.mocked(fetchUserSangakuResult).mockResolvedValue(null);

    const promise = fetchSangakuModalDetail(buildSangaku(null));

    await expect(promise).rejects.toThrow("id=1");
    await expect(promise).rejects.not.toBeInstanceOf(SessionExpiredError);
  });

  test("should reject with a session expired error when the result responds with 401", async () => {
    vi.mocked(fetchUserSangakuResult).mockResolvedValue(undefined);

    await expect(
      fetchSangakuModalDetail(buildSangaku(null)),
    ).rejects.toBeInstanceOf(SessionExpiredError);
  });

  // 同期例外のままだと、クリックのイベントハンドラの外へ投げられ、Error Boundary で
  // 受けられない。reject にして、失敗を再試行つきの表示にする。
  test("should return a rejected promise instead of throwing when the sangaku has no relationships", async () => {
    const broken = { ...buildSangaku(null), relationships: undefined } as unknown as Sangaku;

    let promise!: Promise<unknown>;
    expect(() => {
      promise = fetchSangakuModalDetail(broken);
    }).not.toThrow();
    await expect(promise).rejects.toBeInstanceOf(TypeError);
  });
});

describe("fetchReorderDetail", () => {
  test("should resolve with the sangaku when it is fetched", async () => {
    const sangaku = buildSangaku(null);
    vi.mocked(fetchUserSangaku).mockResolvedValue(sangaku);

    await expect(fetchReorderDetail("1")).resolves.toBe(sangaku);
    expect(fetchUserSangaku).toHaveBeenCalledWith("1");
  });

  test("should reject with an error that includes the sangaku id when it cannot be fetched", async () => {
    vi.mocked(fetchUserSangaku).mockResolvedValue(null);

    const promise = fetchReorderDetail("1");

    await expect(promise).rejects.toThrow("id=1");
    await expect(promise).rejects.not.toBeInstanceOf(SessionExpiredError);
  });

  test("should reject with a session expired error when the response is 401", async () => {
    vi.mocked(fetchUserSangaku).mockResolvedValue(undefined);

    await expect(fetchReorderDetail("1")).rejects.toBeInstanceOf(
      SessionExpiredError,
    );
  });
});
