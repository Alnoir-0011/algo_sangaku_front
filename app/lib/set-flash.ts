import "server-only";
import { cookies } from "next/headers";
import type { Flash } from "@/app/lib/actions/flash";

// actions/flash.ts は consumeFlash のために "use server" が必要で、その export は
// すべて Server Action として外部から直接呼べてしまう。setFlash はサーバー内部からしか
// 呼ばない想定のため、"use server" を持たないこのファイルに分けている。
export async function setFlash(flash: Flash) {
  const cookieStore = await cookies();
  cookieStore.set("flash", JSON.stringify(flash), {
    path: "/",
    maxAge: 60,
    httpOnly: true,
    sameSite: "lax",
    // next.config.ts の CSP 判定と同様、E2E テストは APP_ENV=test で next build && next
    // start を実行するため NODE_ENV は使えない（テスト実行時も "production" になる）
    secure: process.env.APP_ENV !== "test",
  });
}
