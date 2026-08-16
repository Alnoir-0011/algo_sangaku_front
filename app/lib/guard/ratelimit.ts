import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type LimiterResult = {
  success: boolean;
  /** ウィンドウ内で許可されるリクエスト数 */
  limit: number;
  /** ウィンドウ内の残りリクエスト数 */
  remaining: number;
  /** カウンタが回復する時刻（Unix ミリ秒） */
  reset: number;
};

export type Limiter = {
  limit: (key: string, now?: number) => Promise<LimiterResult>;
};

export type RateLimitResult = LimiterResult & {
  /** ストア障害により fail-open した場合に true */
  unavailable: boolean;
};

export type LimiterConfig = {
  limit: number;
  windowMs: number;
};

/** インメモリのエントリ上限。超えたら期限切れのキーを掃除する */
const MAX_ENTRIES = 10_000;

/** Upstash の応答を待つ上限。超えたら通す（可用性優先） */
const UPSTASH_TIMEOUT_MS = 300;

/**
 * プロセス内のスライディングログによるレート制限。
 *
 * Upstash が未設定のときのフォールバック。Edge のアイソレート間で状態を
 * 共有しないため、本番では使わないこと。
 */
export function createMemoryLimiter({ limit, windowMs }: LimiterConfig): Limiter {
  const hits = new Map<string, number[]>();

  /** ウィンドウ外に出たタイムスタンプを落とした履歴を返す */
  const withinWindow = (key: string, threshold: number): number[] =>
    (hits.get(key) ?? []).filter((timestamp) => timestamp > threshold);

  /** すべてのタイムスタンプが期限切れになったキーを取り除く */
  const pruneExpired = (threshold: number): void => {
    for (const [entryKey, timestamps] of hits) {
      if (timestamps.every((timestamp) => timestamp <= threshold)) {
        hits.delete(entryKey);
      }
    }
  };

  return {
    limit: (key, now = Date.now()) => {
      const threshold = now - windowMs;
      const recent = withinWindow(key, threshold);

      if (recent.length >= limit) {
        hits.set(key, recent);
        return Promise.resolve({
          success: false,
          limit,
          remaining: 0,
          reset: recent[0] + windowMs,
        });
      }

      if (hits.size >= MAX_ENTRIES) {
        pruneExpired(threshold);
        // 期限切れが 1 件も無い場合（新しいキーばかりを送り付けられた場合）
        // pruneExpired だけでは縮まない。挿入順＝おおむね古い順に必ず落として
        // 上限を守る。そうしないとアイソレートのメモリを攻撃者に食い潰される
        while (hits.size >= MAX_ENTRIES) {
          const oldestKey = hits.keys().next().value;
          if (oldestKey === undefined) break;
          hits.delete(oldestKey);
        }
      }

      recent.push(now);
      hits.set(key, recent);

      return Promise.resolve({
        success: true,
        limit,
        remaining: limit - recent.length,
        reset: now + windowMs,
      });
    },
  };
}

/**
 * Upstash が設定されていれば Upstash 版を、未設定ならインメモリ版を返す。
 *
 * analytics は無効にしている。無料枠のコマンド数を節約でき、Edge で
 * pending を waitUntil に渡す必要もなくなるため。
 */
export function createLimiter({
  url,
  token,
  limit,
  windowMs,
}: LimiterConfig & {
  url: string | undefined;
  token: string | undefined;
}): Limiter {
  if (!url || !token) {
    return createMemoryLimiter({ limit, windowMs });
  }

  const windowSeconds = Math.round(windowMs / 1000);
  const ratelimit = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
    analytics: false,
    // Upstash が「応答しない」場合は例外が出ないため try/catch では拾えず、
    // middleware がハングして全リクエストのレイテンシに直結する。
    // タイムアウト時は success: true が返り、意図どおりの fail-open になる
    timeout: UPSTASH_TIMEOUT_MS,
    // キーは呼び出し側で "guard:" から組み立てているため、ここでは付けない
    // （付けると guard:guard:... と二重になる）
    prefix: "",
  });

  return {
    limit: async (key) => {
      const result = await ratelimit.limit(key);
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      };
    },
  };
}

/**
 * レート制限を判定する。ストアが落ちていてもリクエストは通す（fail-open）。
 *
 * 可用性を優先し、Upstash を単一障害点にしない。
 */
export async function checkLimit(
  limiter: Limiter,
  key: string,
  now?: number,
): Promise<RateLimitResult> {
  try {
    const result = await limiter.limit(key, now);
    return { ...result, unavailable: false };
  } catch (error) {
    // 例外オブジェクトをそのまま出さない。HTTP クライアント由来の例外は
    // リクエスト設定（Authorization ヘッダー＝Upstash トークン）を
    // 抱えていることがある
    console.error(
      "[guard] rate limit store unavailable:",
      error instanceof Error ? error.message : "unknown error",
    );
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: now ?? Date.now(),
      unavailable: true,
    };
  }
}
