import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { auth } from "@/auth";
import { railsUserOf } from "@/app/lib/rails-user";
import {
  authRoutes,
  isPublicPath,
  apiAuthPrefix,
  adminRoutePrefix,
  DEFAULT_LOGIN_REDIRECT,
} from "@/routes";
import { setFlash } from "@/app/lib/set-flash";
import {
  runGuard,
  resolveGuardMode,
  getDefaultLimiter,
  type GuardDecision,
} from "@/app/lib/guard";

/**
 * 遮断レスポンスを組み立てる。CDN やブラウザにキャッシュさせないこと。
 *
 * status は必ず呼び出し側で確定させてから渡す。未設定のまま Response に渡すと
 * 既定の 200 になり「遮断したつもりで通す」静かな失敗になる。
 */
function guardBlockResponse(status: 403 | 429, decision: GuardDecision): Response {
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });

  if (status === 429 && decision.limit !== undefined) {
    headers.set("RateLimit-Limit", String(decision.limit));
    headers.set("RateLimit-Remaining", String(decision.remaining ?? 0));
    headers.set("RateLimit-Reset", String(decision.resetSec ?? 1));
    headers.set("Retry-After", String(decision.resetSec ?? 1));
  }

  // 遮断理由の詳細は攻撃者の学習材料になるため外には出さない
  return new Response(
    JSON.stringify({ error: status === 429 ? "rate_limited" : "forbidden" }),
    { status, headers },
  );
}

/**
 * 判定結果を観測用ヘッダーとして載せる。
 *
 * 誰にでも返すと、遮断されるリスクなしに回避手法を総当たりできてしまう
 * （どの UA が弾かれるか、どのリクエスト形状が安いか、残量からしきい値の逆算）。
 * GUARD_DEBUG_TOKEN を設定し、それと一致するヘッダーを付けたときだけ返す。
 * 通常の観測は構造化ログ側で行う。
 */
function applyDebugHeaders(
  response: NextResponse,
  request: Request,
  decision: GuardDecision,
): void {
  const token = process.env.GUARD_DEBUG_TOKEN;
  if (!token || request.headers.get("x-guard-debug") !== token) return;

  response.headers.set("x-guard-mode", decision.mode);
  response.headers.set(
    "x-guard-decision",
    decision.action === "block" ? "would-block" : "allow",
  );
  response.headers.set("x-guard-reason", decision.reason);
  if (decision.remaining !== undefined) {
    response.headers.set("x-guard-remaining", String(decision.remaining));
  }
  if (decision.degraded) {
    response.headers.set("x-guard-degraded", "1");
  }
}

export default async function proxy(req: NextRequest) {
  const { nextUrl } = req;
  // Better Auth のセッションがあり、user に Rails の ApiKey などが揃っているときだけ
  // ログイン中とみなす（app/lib/session.ts の getSession と同じ判定）
  // 例外で、公開ページと /signin を含むすべての要求が 500 にならないよう、未ログイン扱いにする。
  // guard の判定は、このあとも行う
  const session = await auth.api
    .getSession({ headers: req.headers })
    .catch((error: unknown) => {
      console.error("[proxy] getSession failed:", error);
      return null;
    });
  const rails = railsUserOf(session);
  const isLoggedIn = !!session && !!rails;

  const guardMode = resolveGuardMode(process.env.GUARD_MODE);
  const decision = await runGuard(
    {
      method: req.method,
      pathname: nextUrl.pathname,
      headers: req.headers,
    },
    {
      mode: guardMode,
      email: session?.user.email ?? null,
      getLimiter: getDefaultLimiter,
    },
  );

  if (decision.action === "block" && decision.status !== undefined) {
    if (guardMode === "enforce") {
      return guardBlockResponse(decision.status, decision);
    }
    // key は出さない。値の一部が検証済みとはいえクライアント由来であり、
    // ユーザーのハッシュも含むため、観測に必要な情報だけに絞る
    console.warn("[guard] would block:", {
      reason: decision.reason,
      pathname: nextUrl.pathname,
    });
  }

  // /api/authors のような、前方一致する別のルートを、認証の対象外にしない
  const isApiAuthRoute =
    nextUrl.pathname === apiAuthPrefix ||
    nextUrl.pathname.startsWith(`${apiAuthPrefix}/`);
  // const isPublicRoute = publicRoutes.includes(nextUrl.pathname);

  const isPublicRoute = isPublicPath(nextUrl.pathname);

  const isAuthRoute = authRoutes.includes(nextUrl.pathname);

  const isAdminRoute = nextUrl.pathname.startsWith(adminRoutePrefix);

  // proxy では next/link のプリフェッチを判別できない（Next が rsc / next-router-prefetch を
  // proxy の前に削除する）ため、プリフェッチかどうかで flash を出し分けられない。
  // プリフェッチの抑止はリンク側（ProtectedLink）で行う
  if (!isApiAuthRoute) {
    if (isAdminRoute) {
      if (!isLoggedIn) {
        await setFlash({ type: "warning", message: "サインインしてください" });
        return NextResponse.redirect(new URL("/signin", nextUrl));
      }
      if (rails?.role !== "admin") {
        return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
      }
    } else if (!isAuthRoute) {
      if (!isLoggedIn && !isPublicRoute) {
        await setFlash({ type: "warning", message: "サインインしてください" });
        return NextResponse.redirect(new URL("/signin", nextUrl));
      }
    } else {
      if (isLoggedIn) {
        return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
      }
    }
  }

  // off のときは何も返さず、ガード導入前とまったく同じ挙動にする
  if (guardMode === "off") return;

  // 許可時に残量を返さない。攻撃者がしきい値の逆算とペース調整に使えるうえ、
  // 中間キャッシュに保存されると無関係な利用者へ配られる余地がある
  const response = NextResponse.next();
  applyDebugHeaders(response, req, decision);
  return response;
}

export const config = {
  // 拡張子による除外は「トップレベルの 1 セグメント」に限定する。
  // 静的ファイルは public/ 直下にしか存在しないため、これで十分。
  // 深さを問わず除外すると、[id] のような動的セグメントはドットを含む値にも
  // マッチするため、/profiles/abc.png のようなパスで proxy ごと
  // スキップされ、ガードだけでなく認証リダイレクトまで効かなくなる
  matcher: ["/((?!_next/|[^/]+\\.[\\w]+$).*)"],
};
