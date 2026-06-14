import { setFlash } from "./actions/flash";

/**
 * data/ ・ actions/ の fetch レスポンスに対する共通エラーハンドラ。
 * 現状は 429（レート制限）時に warning フラッシュを表示する。
 *
 * 注意: setFlash は cookie を書き込むため、Server Action 文脈
 * （Client から呼ばれる action / data 関数）でのみ呼び出すこと。
 * Server Component のレンダリング中に呼ぶと cookie 書き込みエラーになる。
 */
export async function handleApiError(res: Response): Promise<void> {
  if (res.status === 429) {
    await setFlash({
      type: "warning",
      message: "リクエストが多すぎます。しばらくしてから再試行してください。",
    });
  }
}
