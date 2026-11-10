import { http, HttpResponse } from "@/tests/e2e/fixtures.msw";

/**
 * `/api/v1/user/sangakus` が返す算額 1 件分のレスポンス。
 * `shrineId` を渡すとその神社に奉納済み、省略すると未奉納になる。
 */
export const sangakuOf = (
  title: string,
  { id = title, shrineId }: { id?: string; shrineId?: string } = {},
) => ({
  id,
  type: "sangaku",
  attributes: {
    title,
    description: "test_description",
    source: "puts 'Hello world'",
    difficulty: "easy",
    inputs: [],
  },
  relationships: {
    user: { data: { id: "1", type: "user" } },
    shrine: { data: shrineId ? { id: shrineId, type: "shrine" } : null },
  },
});

/**
 * page クエリで中身が変わる 2 ページ分の一覧を返すハンドラ。
 * 1 ページ目は `first_page`、2 ページ目は `second_page` というタイトルの算額を返す。
 */
export const pagedSangakusHandler = (
  apiUrl: string | undefined,
  { shrineId }: { shrineId?: string } = {},
) => {
  // 未設定のまま URL を組むと `undefined/api/...` になり、ハンドラが一致しない原因が分かりにくい
  if (!apiUrl) {
    throw new Error("API_URL is not set");
  }
  return http.get(`${apiUrl}/api/v1/user/sangakus`, ({ request }) => {
    const currentPage = new URL(request.url).searchParams.get("page");
    const title = currentPage === "2" ? "second_page" : "first_page";
    return HttpResponse.json(
      { data: [sangakuOf(title, { shrineId })] },
      { status: 200, headers: { "total-pages": "2" } },
    );
  });
};
