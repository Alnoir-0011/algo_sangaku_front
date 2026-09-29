export const apiUrl = process.env.API_URL!;

// バックエンドAPI呼び出し・位置情報取得などが応答しない場合に、呼び出し元の
// isLoading 等の状態が固まり続けないようにするためのデフォルトタイムアウト。
// OpenAI呼び出しのように10秒を超えうる処理は、呼び出し側で個別に上書きする。
export const DEFAULT_NETWORK_TIMEOUT_MS = 10_000;
