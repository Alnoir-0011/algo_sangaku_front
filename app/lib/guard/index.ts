import { classifyBot } from "./bot";
import { getClientIp } from "./ip";
import {
  checkLimit,
  createLimiter,
  createMemoryLimiter,
  type Limiter,
  type LimiterConfig,
} from "./ratelimit";

export type GuardMode = "off" | "shadow" | "enforce";

/**
 * レート制限の経路グループ。
 *
 * 「カウントしない」グループを意図的に用意していない。分類漏れが
 * そのままレート制限の抜け穴になるため、未知のものは最も厳しい
 * server-action として数える（default-deny）。
 */
export type RouteGroup = "server-action" | "signin" | "public-get";

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
  /** 判定そのものができず素通しした場合に true */
  unavailable?: boolean;
  /**
   * 共有ストアが使えず、インメモリの近似カウンタで数えた場合に true。
   * 制限はかかっているが精度が落ちている状態を表す。
   */
  degraded?: boolean;
};

export type GuardReason =
  | "ok"
  | "bot-ua"
  | "crawler-scope"
  | "rate-limited"
  | "store-unavailable"
  | "guard-error";

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
  getLimiter: (group: RouteGroup) => Limiter;
  now?: number;
};

type Identity = {
  ip: string;
  email: string | null;
};

const ONE_MINUTE_MS = 60_000;

type BucketConfig = LimiterConfig & {
  /**
   * shared   … Upstash で数える（アイソレート間で共有・正確）
   * isolated … インメモリで数える（アイソレート単位・近似）
   */
  store: "shared" | "isolated";
};

/**
 * 経路グループごとのしきい値とカウント先。
 *
 * しきい値はすべて仮の初期値であり、shadow での観測を経てから調整する。
 *
 * public-get だけ isolated にしているのは Upstash の消費を抑えるため。
 * 全リクエストの大半は公開 GET（App Router の自動 prefetch を含む）で、
 * これを Upstash で数えると無料枠の月 500K コマンドをすぐ使い切る。
 * 使い切ると全経路のレート制限が失われるため、守る優先度が最も高い
 * 従量課金 API（server-action）とサインインに枠を回している。
 *
 * ただし isolated は「アイソレートごとに limit」なので、実効上限は
 * アイソレート数に応じて緩む。しかも負荷が高いほど Vercel が
 * スケールアウトしてアイソレートが増えるため、**制限が最も必要な瞬間ほど
 * 効きが弱くなる**。公開 GET の防御は「無制限よりまし」の水準であり、
 * back 側の防御が別途成立していることが前提になる。
 *
 * public-get の 300 は実測に基づく。App Router は表示領域内のリンクを
 * 自動 prefetch するため、1 ページ閲覧で `?_rsc=` 付きの GET が数件飛び、
 * 合計 5 リクエスト前後（トップページは 7）を消費する。当初の 60 では
 * 12 ページ/分（5 秒に 1 ページ）で上限に達し、通常の回遊で 429 になった。
 * 300 は 1 秒 1 ページ相当の閲覧を許容する値で、人間の操作としては
 * ほぼ上限にあたる。これを超えるのはスクリプトである。
 *
 * prefetch の件数はコンテンツ件数に比例しない（算額 4 件のページと 0 件の
 * ページが同じリクエスト数だった）。カードが <Link> を持たず、地図の
 * マーカーもクライアント側描画のため、ヘッダー/フッターのナビ分で固定される。
 */
export const RATE_LIMIT_BUCKETS = {
  "server-action": { limit: 20, windowMs: ONE_MINUTE_MS, store: "shared" },
  signin: { limit: 10, windowMs: ONE_MINUTE_MS, store: "shared" },
  "public-get": { limit: 300, windowMs: ONE_MINUTE_MS, store: "isolated" },
} as const satisfies Record<RouteGroup, BucketConfig>;

const AUTH_ROUTE_PREFIX = "/api/auth";

/** ハッシュから取り出す桁数。32 桁 = 128bit あれば総当たりは現実的でない */
const HASH_LENGTH = 32;

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

/**
 * リクエストをレート制限の経路グループに分類する。
 *
 * 判定は必ずパスを先に見る。`next-action` はクライアントが自由に付けられる
 * ヘッダーなので、先に見ると `/api/auth/*` への POST にこれを付けるだけで
 * signin（10/分）を server-action（20/分）へ格上げでき、サインイン攻撃の
 * しきい値を緩められてしまう。
 *
 * どの条件にも当てはまらないものは server-action として数える。Server Action は
 * `next-action` ヘッダーだけでなくボディの `$ACTION_ID_*` でも起動できるほか、
 * PUT や HEAD でもページは描画される。「分類できないものは数えない」設計は
 * そのまま回避経路になる。
 */
export function classifyRoute(method: string, pathname: string): RouteGroup {
  if (pathname.startsWith(AUTH_ROUTE_PREFIX)) {
    return method === "GET" ? "public-get" : "signin";
  }

  if (method === "GET" || method === "HEAD") return "public-get";

  return "server-action";
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

/**
 * Upstash 上に平文のメールアドレスを残さないためのハッシュ化。
 *
 * 素の SHA-256 では守れない。メールアドレスは列挙可能な空間なので、
 * Redis の内容やログが漏れた時点で総当たりで元の値を特定できてしまう。
 * AUTH_SECRET を鍵にした HMAC にすることで、鍵を知らない相手には
 * 逆引きできないようにしている。
 */
async function hashIdentifier(value: string): Promise<string> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is required to derive the rate limit key");
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value),
  );

  return Array.from(new Uint8Array(signature))
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
const limiterCache = new Map<RouteGroup, Limiter>();

export function getDefaultLimiter(group: RouteGroup): Limiter {
  const cached = limiterCache.get(group);
  if (cached) return cached;

  const bucket = RATE_LIMIT_BUCKETS[group];
  // フィールドを明示的に取り出す。rest 展開だと BucketConfig にフィールドが
  // 増えたとき、構造的部分型のため気付かないまま limiter 側へ流れてしまう
  const config = { limit: bucket.limit, windowMs: bucket.windowMs };

  if (bucket.store === "isolated") {
    const memoryLimiter = createMemoryLimiter(config);
    limiterCache.set(group, memoryLimiter);
    return memoryLimiter;
  }

  // Vercel の Upstash 統合が注入する変数名に合わせている。
  // KV_REST_API_READ_ONLY_TOKEN も同時に注入されるが、レート制限は
  // カウンタを書き込むため読み取り専用トークンでは動かない
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  // 未設定のまま本番へ出ると「有効化したつもりで無防備」になる。
  // インメモリのカウンタは Edge のアイソレート間で共有されないため、
  // enforce にしても実質的な制限がかからない
  if (!url || !token) {
    console.error(
      `[guard] KV_REST_API_URL / KV_REST_API_TOKEN が未設定のため、` +
        `${group} をアイソレート間で共有されないインメモリカウンタで数えます。` +
        `本番では必ず設定してください。`,
    );
  }

  const limiter = createLimiter({ url, token, ...config });
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
  options: GuardOptions,
): Promise<GuardDecision> {
  // off のときは一切の副作用を持たない（ストアにも触れない）
  if (options.mode === "off") {
    return { mode: options.mode, action: "allow", reason: "ok" };
  }

  // ガードの内部エラーでサイト全体を落とさない。fail-open を Upstash の
  // 例外だけでなく、判定処理そのものの想定外エラーにも効かせる
  try {
    return await evaluateGuard(request, options);
  } catch (error) {
    console.error("[guard] evaluation failed:", toLogMessage(error));
    return { mode: options.mode, action: "allow", reason: "guard-error" };
  }
}

/** 例外からログに出して安全な情報だけを取り出す（認証情報の混入を避ける） */
function toLogMessage(error: unknown): string {
  return error instanceof Error ? error.message : "unknown error";
}

async function evaluateGuard(
  request: GuardRequest,
  { mode, email, getLimiter, now = Date.now() }: GuardOptions,
): Promise<GuardDecision> {

  const botClass = classifyBot(request.headers.get("user-agent"));
  const group = classifyRoute(request.method, request.pathname);

  if (botClass === "malicious") {
    return { mode, action: "block", status: 403, reason: "bot-ua" };
  }

  // クローラーには公開ページの閲覧だけを許す
  const isCrawler =
    botClass === "claimed-crawler" || botClass === "seo-crawler";
  if (isCrawler && group !== "public-get") {
    return { mode, action: "block", status: 403, reason: "crawler-scope" };
  }

  // prefetch を除外する分岐は置かない。middleware から prefetch を識別する
  // 公式の手段が存在しないため。
  //   - Next.js は middleware を呼ぶ直前に FLIGHT_HEADERS（rsc /
  //     next-router-prefetch 等）を必ず削除するので、これらのヘッダーは届かない
  //   - クエリの _rsc は「Vary を尊重しない CDN 向けのキャッシュキー」と
  //     公式に位置づけられたもので（docs/01-app/02-guides/cdn-caching.mdx）、
  //     信頼できる識別子ではない。これで除外するとクライアントが付けるだけで
  //     レート制限を回避できてしまう
  // prefetch のぶんは「数える」前提で public-get のしきい値を決めること。
  // 公式の認証ガイドも middleware が prefetch リクエスト上で動くことを前提に
  // 「重い処理を置くな」と述べている（SPEC §9.5）。

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
    degraded: result.degraded,
  };

  if (!result.success) {
    return { mode, action: "block", status: 429, reason: "rate-limited", ...budget };
  }

  return { mode, action: "allow", reason: "ok", ...budget };
}
