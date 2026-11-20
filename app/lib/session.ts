import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth, SKIP_API_KEY_REVOCATION_HEADER } from "@/auth";
import { railsUserOf } from "@/app/lib/rails-user";

// RSC では headers() の戻り値をそのまま渡すと cookie を読めず getSession が null になる
// （ルートハンドラーでは通る）。エントリを通常の Headers に写して渡す。
// new Headers(await headers()) は Next 16 で空になるため、エントリ配列を経由する
export async function requestHeaders() {
  return new Headers([...(await headers()).entries()]);
}

// Better Auth のセッションがあり、Rails の ApiKey・nickname・role が揃っているときだけ
// ログイン中とみなす。バックエンドを呼べない状態を、ログイン中と扱わないため。
// 1 つのリクエストの中で複数回呼ばれる（ページと、そのデータ取得関数）ため、
// リクエスト単位でまとめる（cookie の復号を 1 回にする）
export const getSession = cache(async () => {
  const session = await auth.api.getSession({ headers: await requestHeaders() });
  const rails = railsUserOf(session);
  if (!session || !rails) return null;

  // role は session.role で渡し、user には残さない（ApiKey は session の記録にあり、user には無い）
  const user = { ...session.user } as typeof session.user & { role?: unknown };
  delete user.role;
  return {
    user: { ...user, nickname: rails.nickname },
    role: rails.role,
    accessToken: rails.accessToken,
  };
});

export async function updateSessionNickname(nickname: string) {
  await auth.api.updateUser({
    body: { nickname },
    headers: await requestHeaders(),
  });
}

// revokeApiKey: false は、バックエンドが 401 を返したあとのサインアウト用。
// ApiKey はすでに失効しているため、DELETE を送らない（遅延と、バックエンドの 401 ログを避ける）
export async function signOutAndRedirect(
  redirectTo: string,
  { revokeApiKey = true }: { revokeApiKey?: boolean } = {},
): Promise<never> {
  const signOutHeaders = await requestHeaders();
  if (!revokeApiKey) signOutHeaders.set(SKIP_API_KEY_REVOCATION_HEADER, "1");
  await auth.api.signOut({ headers: signOutHeaders });
  redirect(redirectTo);
}
