import { createAuthClient } from "better-auth/react";

// サーバー側でセッションが無効になっても（別タブでのサインアウト、期限切れ）、
// クライアントの useSession には伝わらない。標準の再取得はフォーカス復帰のみで、
// 操作を続けているタブは古い状態のまま残るため、ポーリングで間隔を区切る。
// 古い状態が残る最長の時間がこの間隔になる。get-session は呼び出しのたびに
// 関数の実行になるため、短くしすぎない
export const SESSION_REFETCH_INTERVAL_SECONDS = 60;

export const authClient = createAuthClient({
  sessionOptions: { refetchInterval: SESSION_REFETCH_INTERVAL_SECONDS },
});
