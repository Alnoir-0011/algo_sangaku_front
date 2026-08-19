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
  /**
   * 共有ストアが使えず、インメモリのカウンタで数えた場合に true。
   * アイソレート単位の近似になっているという意味であり、
   * 制限がかかっていない（unavailable）とは区別する。
   */
  degraded?: boolean;
};

export type Limiter = {
  limit: (key: string, now?: number) => Promise<LimiterResult>;
};

export type RateLimitResult = LimiterResult & {
  /** 判定そのものができず素通しした場合に true */
  unavailable: boolean;
};

export type LimiterConfig = {
  limit: number;
  windowMs: number;
};

/** インメモリのエントリ上限。超えたら最終アクセスの古いものから落とす */
const MAX_ENTRIES = 10_000;

/** Upstash の応答を待つ上限。超えたらインメモリへ退避する */
const UPSTASH_TIMEOUT_MS = 300;

/**
 * 退避時にしきい値を割る数。
 *
 * 退避先はアイソレートごとに独立して数えるため、同じしきい値のままだと
 * 実効上限がアイソレート数倍に緩む。退避中はむしろ絞る。
 */
const FALLBACK_DIVISOR = 4;

/** 退避の記録を出す間隔。障害中に毎リクエスト出力するとログ課金が膨らむ */
const REPORT_INTERVAL_MS = 60_000;

/**
 * プロセス内のスライディングログによるレート制限。
 *
 * Edge のアイソレート間で状態を共有しないため、実効上限はアイソレート数に
 * 応じて緩む。負荷が高いほどスケールアウトしてアイソレートが増えるので、
 * **制限が最も必要な瞬間ほど効きが弱くなる**点に注意する。
 */
export function createMemoryLimiter({ limit, windowMs }: LimiterConfig): Limiter {
  const hits = new Map<string, number[]>();
  let lastPrunedAt = 0;

  /** すべてのタイムスタンプが期限切れになったキーを取り除く */
  const pruneExpired = (threshold: number): void => {
    for (const [entryKey, timestamps] of hits) {
      if (timestamps.every((timestamp) => timestamp <= threshold)) {
        hits.delete(entryKey);
      }
    }
  };

  /**
   * 上限に達した Map を縮める。
   *
   * 全走査は満杯時に毎リクエスト走ると重いため、ウィンドウごとに 1 回までに
   * 抑える。それでも縮まらない場合は最終アクセスの古いものから落とす。
   */
  const evictIfFull = (now: number, threshold: number): void => {
    if (hits.size < MAX_ENTRIES) return;

    if (now - lastPrunedAt > windowMs) {
      pruneExpired(threshold);
      lastPrunedAt = now;
    }

    while (hits.size >= MAX_ENTRIES) {
      const oldestKey = hits.keys().next().value;
      if (oldestKey === undefined) break;
      hits.delete(oldestKey);
    }
  };

  return {
    limit: (key, now = Date.now()) => {
      const threshold = now - windowMs;
      const recent = (hits.get(key) ?? []).filter(
        (timestamp) => timestamp > threshold,
      );

      // Map#set は既存キーの挿入位置を変えないため、必ず delete してから
      // set し直して「最終アクセス順」を保つ。これをしないと、上限到達時の
      // 追い出しで「いま制限に掛かっているキー」から先に消えてしまい、
      // 新規キーを流し込むだけでカウンタをリセットできる回避経路になる
      hits.delete(key);

      if (recent.length >= limit) {
        hits.set(key, recent);
        return Promise.resolve({
          success: false,
          limit,
          remaining: 0,
          reset: recent[0] + windowMs,
        });
      }

      evictIfFull(now, threshold);

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
 * ストアが使えないときにインメモリのカウンタへ退避する limiter を作る。
 *
 * 素通しにはしない。Upstash の無料枠（月 500K コマンド）を使い切ると
 * 以降のリクエストが全部エラーになるため、素通しだと「月末になると
 * レート制限が消える」ことになり、守りたい従量課金 API が一番無防備になる。
 *
 * 退避先は wrapper の生存期間中ずっと使い回される。primary が復帰すれば
 * そこで return するため退避先は読み書きされなくなるが、primary が
 * 間欠的に失敗する状態では「primary の枠」と「退避先の枠」が並行して
 * 消費されるため、その間だけ実効上限が緩む点に注意する。
 */
export function withMemoryFallback(
  primary: Limiter,
  config: LimiterConfig,
): Limiter {
  const fallback = createMemoryLimiter(config);
  let lastReportedAt = 0;
  let degradedCount = 0;

  return {
    limit: async (key, now = Date.now()) => {
      try {
        const result = await primary.limit(key, now);

        if (degradedCount > 0) {
          console.info(
            `[guard] ストアが復旧しました（退避中に判定した件数: ${degradedCount}）`,
          );
          degradedCount = 0;
          lastReportedAt = 0;
        }
        return result;
      } catch (error) {
        degradedCount += 1;

        // 再発を検知できるよう、一定間隔ごとに出し直す
        if (now - lastReportedAt > REPORT_INTERVAL_MS) {
          lastReportedAt = now;
          console.error(
            "[guard] ストアが使えないためインメモリのカウンタへ退避します:",
            error instanceof Error ? error.message : "unknown error",
          );
        }

        const result = await fallback.limit(key, now);
        return { ...result, degraded: true };
      }
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
    // middleware がハングして全リクエストのレイテンシに直結する
    timeout: UPSTASH_TIMEOUT_MS,
    // キーは呼び出し側で "guard:" から組み立てているため、ここでは付けない
    // （付けると guard:guard:... と二重になる）
    prefix: "",
  });

  const upstashLimiter: Limiter = {
    limit: async (key) => {
      const result = await ratelimit.limit(key);

      // ライブラリはタイムアウト時に reject せず success: true で resolve する。
      // ここで例外にしないと退避処理に落ちず、レート制限が無言で全面解除される
      if (result.reason === "timeout") {
        throw new Error("upstash timeout");
      }

      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      };
    },
  };

  return withMemoryFallback(upstashLimiter, {
    limit: Math.max(1, Math.ceil(limit / FALLBACK_DIVISOR)),
    windowMs,
  });
}

/**
 * レート制限を判定する。
 *
 * 通常の障害は createLimiter 内の退避処理で吸収されるため、ここに来るのは
 * 退避先まで失敗した場合だけ。最後の砦としてリクエストを通す。
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
