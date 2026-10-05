import { hashIdentifier } from "@/app/lib/guard";
import { checkLimit, createLimiter, type Limiter } from "@/app/lib/guard/ratelimit";

/**
 * runSource（PaizaIO 試し実行）専用のレート制限。
 *
 * middleware の "server-action" バケット（全 Server Action 共通・20/分）とは
 * 独立に、試し実行だけを狙って絞る。1 回の呼び出しで fixedInputs を
 * 何件並行実行しても、ここでは呼び出し単位で 1 カウントとする
 * （呼び出し側で呼ぶのは 1 回のみ）。
 *
 * 5 回/分は issue #78 での運用判断値。コードを微調整しながら試し実行する
 * 通常の利用（数回/分程度）は妨げず、連打による PaizaIO 濫用・課金リスクを
 * 抑える値として決めている。
 */
const LIMIT = 5;
const WINDOW_MS = 60_000;

let cachedLimiter: Limiter | undefined;

function getRunSourceLimiter(): Limiter {
  if (cachedLimiter) return cachedLimiter;

  // Vercel の Upstash 統合が注入する変数名。未設定ならインメモリへ
  // フォールバックする（createLimiter 側の挙動）。
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  // 未設定のまま本番へ出ると、Edge のアイソレート間で共有されない
  // インメモリカウンタで数えることになり、実質的に制限がかからない
  if (!url || !token) {
    console.error(
      "[rate-limit/run-source] KV_REST_API_URL / KV_REST_API_TOKEN が未設定のため、" +
        "アイソレート間で共有されないインメモリカウンタで数えます。本番では必ず設定してください。",
    );
  }

  cachedLimiter = createLimiter({ url, token, limit: LIMIT, windowMs: WINDOW_MS });
  return cachedLimiter;
}

/**
 * 認証済みユーザーの email を基にレート制限を判定する。
 *
 * ストアが完全に使えない場合（退避先のインメモリカウンタも失敗した場合）は
 * fail-open（許可）。試し実行の可用性をレート制限より優先する。
 * Upstash 障害時は即座に fail-open になるわけではなく、まず
 * `createLimiter` 内部でインメモリカウンタへ退避して数え続ける
 * （退避中はインスタンス単位・元の 1/4 の閾値に縮退する）。
 */
export async function checkRunSourceRateLimit(email: string): Promise<boolean> {
  const key = `run-source:user:${await hashIdentifier(email)}`;
  const result = await checkLimit(getRunSourceLimiter(), key);
  return result.success;
}
