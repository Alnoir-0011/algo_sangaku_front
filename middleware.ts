import { NextResponse } from "next/server";

import { auth } from "@/auth";
import {
  authRoutes,
  publicRoutes,
  apiAuthPrefix,
  adminRoutePrefix,
  DEFAULT_LOGIN_REDIRECT,
} from "@/routes";
import { setFlash } from "./app/lib/actions/flash";
import {
  runGuard,
  resolveGuardMode,
  getDefaultLimiter,
  type GuardDecision,
} from "@/app/lib/guard";

/** 遮断レスポンスを組み立てる。CDN やブラウザにキャッシュさせないこと */
function guardBlockResponse(decision: GuardDecision): Response {
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  applyRateLimitHeaders(headers, decision);

  if (decision.status === 429 && decision.resetSec !== undefined) {
    headers.set("Retry-After", String(decision.resetSec));
  }

  // 遮断理由の詳細は攻撃者の学習材料になるため外には出さない
  const body = decision.status === 429 ? "rate_limited" : "forbidden";
  return new Response(JSON.stringify({ error: body }), {
    status: decision.status,
    headers,
  });
}

function applyRateLimitHeaders(headers: Headers, decision: GuardDecision): void {
  if (decision.limit === undefined) return;
  headers.set("RateLimit-Limit", String(decision.limit));
  headers.set("RateLimit-Remaining", String(decision.remaining ?? 0));
  headers.set("RateLimit-Reset", String(decision.resetSec ?? 1));
}

/** shadow では遮断せず、判定結果を観測用ヘッダーとしてのみ載せる */
function applyShadowHeaders(headers: Headers, decision: GuardDecision): void {
  headers.set("x-guard-mode", decision.mode);
  headers.set(
    "x-guard-decision",
    decision.action === "block" ? "would-block" : "allow",
  );
  headers.set("x-guard-reason", decision.reason);
  if (decision.remaining !== undefined) {
    headers.set("x-guard-remaining", String(decision.remaining));
  }
}

export default auth(async (req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const guardMode = resolveGuardMode(process.env.GUARD_MODE);
  const decision = await runGuard(
    {
      method: req.method,
      pathname: nextUrl.pathname,
      headers: req.headers,
    },
    {
      mode: guardMode,
      email: req.auth?.user?.email ?? null,
      getLimiter: getDefaultLimiter,
    },
  );

  if (guardMode === "enforce" && decision.action === "block") {
    return guardBlockResponse(decision);
  }

  if (guardMode === "shadow" && decision.action === "block") {
    console.warn("[guard] would block:", {
      reason: decision.reason,
      key: decision.key,
      pathname: nextUrl.pathname,
    });
  }

  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  // const isPublicRoute = publicRoutes.includes(nextUrl.pathname);

  const isPublicRoute = publicRoutes.some((route) =>
    typeof route === "string"
      ? route === nextUrl.pathname
      : route.test(nextUrl.pathname),
  );

  const isAuthRoute = authRoutes.includes(nextUrl.pathname);

  const isPrefetch = req.headers.get("Next-Router-Prefetch") === "1";

  const isAdminRoute = nextUrl.pathname.startsWith(adminRoutePrefix);

  if (!isApiAuthRoute) {
    if (isAdminRoute) {
      if (!isLoggedIn) {
        if (!isPrefetch) {
          await setFlash({ type: "warning", message: "サインインしてください" });
        }
        return Response.redirect(new URL("/signin", nextUrl));
      }
      if (req.auth?.role !== "admin") {
        return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
      }
    } else if (!isAuthRoute) {
      if (!isLoggedIn && !isPublicRoute) {
        if (!isPrefetch) {
          await setFlash({ type: "warning", message: "サインインしてください" });
        }
        return Response.redirect(new URL("/signin", nextUrl));
      }
    } else {
      if (isLoggedIn) {
        return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
      }
    }
  }

  // off のときは何も返さず、ガード導入前とまったく同じ挙動にする
  if (guardMode === "off") return;

  const response = NextResponse.next();
  if (guardMode === "shadow") {
    applyShadowHeaders(response.headers, decision);
  } else {
    applyRateLimitHeaders(response.headers, decision);
  }
  return response;
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
