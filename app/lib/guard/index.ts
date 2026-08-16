import { classifyBot } from "./bot";
import { getClientIp } from "./ip";
import {
  checkLimit,
  createLimiter,
  type Limiter,
  type LimiterConfig,
} from "./ratelimit";

export type GuardMode = "off" | "shadow" | "enforce";

export type RouteGroup =
  | "server-action"
  | "signin"
  | "public-get"
  | "other";

/** レート制限のカウント対象になる経路グループ */
export type CountedRouteGroup = Exclude<RouteGroup, "other">;

export type GuardDecision = {
  mode: GuardMode;
  /** shadow のときは block でも実際には遮断しない */
  action: "allow" | "block";
  status?: 403 | 429;
  reason: GuardReason;
  key?: string;
  limit?: number;
  remaining?: number;
  resetSec?: number;
  /** ストア障害により fail-open した場合に true */
  unavailable?: boolean;
};

export type GuardReason =
  | "ok"
  | "prefetch"
  | "unmetered"
  | "bot-ua"
  | "crawler-scope"
  | "rate-limited"
  | "store-unavailable";

/** NextRequest から必要な情報だけを取り出した形。テストしやすさのため構造型にしている */
export type GuardRequest = {
  method: string;
  pathname: string;
  headers: Headers;
};

export type GuardOptions = {
  mode: GuardMode;
  /** 認証済みなら session のメールアドレス、未認証なら null */
  email: string | null;
  getLimiter: (group: CountedRouteGroup) => Limiter;
  now?: number;
};

type Identity = {
  ip: string;
  email: string | null;
};

const ONE_MINUTE_MS = 60_000;

/**
 * 経路グループごとのしきい値。
 *
 * すべて仮の初期値であり、shadow での観測を経てから調整する。
 */
export const RATE_LIMIT_BUCKETS = {
  "server-action": { limit: 20, windowMs: ONE_MINUTE_MS },
  signin: { limit: 10, windowMs: ONE_MINUTE_MS },
  "public-get": { limit: 60, windowMs: ONE_MINUTE_MS },
} as const satisfies Record<CountedRouteGroup, LimiterConfig>;

const AUTH_ROUTE_PREFIX = "/api/auth";

/** ハッシュから取り出す桁数。衝突確率と Redis のキー長のバランスで決めている */
const HASH_LENGTH = 16;

/**
 * GUARD_MODE の値を解決する。
 *
 * 認識できない値・未設定はすべて off。厳密一致にしているため
 * "SHADOW" のような表記揺れでは有効にならず、意図しない遮断を防げる。
 */
export function resolveGuardMode(raw: string | undefined): GuardMode {
  if (raw === "shadow") return "shadow";
  if (raw === "enforce") return "enforce";
  return "off";
}

/** リクエストをレート制限の経路グループに分類する。other はカウントしない */
export function classifyRoute(
  method: string,
  pathname: string,
  headers: Headers,
): RouteGroup {
  if (method === "POST") {
    if (headers.get("next-action")) return "server-action";
    if (pathname.startsWith(AUTH_ROUTE_PREFIX)) return "signin";
    return "other";
  }

  if (method === "GET") return "public-get";

  return "other";
}

/**
 * レート制限のキーを組み立てる。
 *
 * 認証済みの Server Action だけはユーザー単位で数える。共有回線の
 * 正規ユーザーを巻き込まないため。それ以外は IP 単位。
 */
export async function buildRateLimitKey(
  group: RouteGroup,
  identity: Identity,
): Promise<string> {
  if (group === "server-action" && identity.email) {
    return `guard:${group}:user:${await hashIdentifier(identity.email)}`;
  }
  return `guard:${group}:ip:${identity.ip}`;
}

/** Upstash 上に平文のメールアドレスを残さないためのハッシュ化 */
async function hashIdentifier(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, HASH_LENGTH);
}

/**
 * Unix ミリ秒の回復時刻を RateLimit-Reset 用の残り秒数へ変換する。
 *
 * IETF ドラフトの RateLimit-Reset は残り秒数を期待しているため、
 * Upstash が返す絶対時刻をそのまま出してはいけない。
 */
export function toResetSeconds(reset: number, now: number): number {
  return Math.max(1, Math.floor((reset - now) / 1000));
}

/** グループごとの limiter を遅延生成してキャッシュする */
const limiterCache = new Map<CountedRouteGroup, Limiter>();

export function getDefaultLimiter(group: CountedRouteGroup): Limiter {
  const cached = limiterCache.get(group);
  if (cached) return cached;

  const limiter = createLimiter({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
    ...RATE_LIMIT_BUCKETS[group],
  });
  limiterCache.set(group, limiter);
  return limiter;
}

/**
 * Bot 判定とレート制限を評価して判定結果を返す。
 *
 * この関数自体は遮断しない。shadow と enforce で同じ判定を返し、
 * それを実際に適用するかどうかは呼び出し側（middleware）が決める。
 */
export async function runGuard(
  request: GuardRequest,
  { mode, email, getLimiter, now = Date.now() }: GuardOptions,
): Promise<GuardDecision> {
  // off のときは一切の副作用を持たない（ストアにも触れない）
  if (mode === "off") {
    return { mode, action: "allow", reason: "ok" };
  }

  const botClass = classifyBot(request.headers.get("user-agent"));
  const group = classifyRoute(request.method, request.pathname, request.headers);

  if (botClass === "malicious") {
    return { mode, action: "block", status: 403, reason: "bot-ua" };
  }

  // クローラーには公開ページの閲覧だけを許す
  const isCrawler =
    botClass === "verified-crawler" || botClass === "seo-crawler";
  if (isCrawler && group !== "public-get") {
    return { mode, action: "block", status: 403, reason: "crawler-scope" };
  }

  // prefetch はユーザーの操作ではないため予算を消費させない
  if (request.headers.get("Next-Router-Prefetch") === "1") {
    return { mode, action: "allow", reason: "prefetch" };
  }

  if (group === "other") {
    return { mode, action: "allow", reason: "unmetered" };
  }

  const ip = getClientIp(request.headers);
  const key = await buildRateLimitKey(group, { ip, email });
  const result = await checkLimit(getLimiter(group), key, now);

  // ストアが落ちているときは可用性を優先して通す
  if (result.unavailable) {
    return {
      mode,
      action: "allow",
      reason: "store-unavailable",
      key,
      unavailable: true,
    };
  }

  const budget = {
    key,
    limit: result.limit,
    remaining: result.remaining,
    resetSec: toResetSeconds(result.reset, now),
  };

  if (!result.success) {
    return { mode, action: "block", status: 429, reason: "rate-limited", ...budget };
  }

  return { mode, action: "allow", reason: "ok", ...budget };
}
