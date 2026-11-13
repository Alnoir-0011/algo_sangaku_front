import type { NextRequest } from "next/server";
import { handlers } from "@/auth";
import { stripSessionCookieReissue } from "@/app/lib/session-cookie";
import { apiAuthPrefix } from "@/routes";

export const { POST } = handlers;

// proxy は /api/auth を素通しするため、proxy 側の除去ではこの GET の再発行を塞げない。
// POST は update() がトークンの中身を書き換えるため、再発行を残す
export async function GET(request: NextRequest) {
  const response = await handlers.GET(request);
  if (request.nextUrl.pathname === `${apiAuthPrefix}/session`) {
    stripSessionCookieReissue(response);
  }
  return response;
}
