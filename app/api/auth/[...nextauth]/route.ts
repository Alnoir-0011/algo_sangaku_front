import type { NextRequest } from "next/server";
import { handlers } from "@/auth";
import { stripSessionCookieReissue } from "@/app/lib/session-cookie";
import { toBrowserSession } from "@/app/lib/session-response";
import { apiAuthPrefix } from "@/routes";

// 完全一致では判定しない。Auth.js は空のセグメントを無視するため、/api/auth/session/ や
// /api/auth//session も session として扱う。今は Next の 308 リダイレクトで届かないが、
// next.config.ts に trailingSlash: true や skipTrailingSlashRedirect: true を設定すると
// そのまま届き、本文の絞り込みと再発行の除去の両方をすり抜ける。設定を変えるときは、
// tests/unit/api/auth/route.test.ts の末尾スラッシュのテストを確認すること
const isSessionRequest = (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith(apiAuthPrefix)) return false;

  const segments = pathname
    .slice(apiAuthPrefix.length)
    .split("/")
    .filter(Boolean);
  return segments.length === 1 && segments[0] === "session";
};

// proxy は /api/auth を素通しするため、proxy 側の除去ではこの GET の再発行を塞げない
export async function GET(request: NextRequest) {
  const response = await handlers.GET(request);
  if (!isSessionRequest(request)) return response;

  stripSessionCookieReissue(response);
  return toBrowserSession(response);
}

// セッションの更新はサーバー側の unstable_update で行い、ブラウザからは使わない。
// 受け付けると、CSRF トークンだけでバックエンドの検証を通らない nickname を JWT に書ける
export async function POST(request: NextRequest) {
  if (isSessionRequest(request)) {
    return new Response(null, { status: 405, headers: { Allow: "GET" } });
  }
  return handlers.POST(request);
}
