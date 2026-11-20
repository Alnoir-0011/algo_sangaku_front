export type RailsUser = {
  accessToken: string;
  nickname: string;
  role: "general" | "admin";
};

// 3 項目の型を確かめる。サインイン時（getUserInfo）と、ログイン判定（railsUserOf）の両方が
// この判定を使う。書き込み側だけが緩いと、サインインに成功した直後に、ログインしていない
// 状態になる
export function toRailsUser(fields: {
  accessToken: unknown;
  nickname: unknown;
  role: unknown;
}): RailsUser | null {
  const { accessToken, nickname, role } = fields;
  if (
    typeof accessToken !== "string" ||
    accessToken === "" ||
    typeof nickname !== "string" ||
    (role !== "general" && role !== "admin")
  ) {
    return null;
  }
  return { accessToken, nickname, role };
}

// Better Auth のセッションから、Rails の ApiKey・nickname・role を取り出す。
// ApiKey は session の記録に、nickname・role は user の記録にある。cookie は暗号化されて
// 改ざんできないが、項目が欠けた記録を「ログイン中」として通さないよう、型を確かめる
export function railsUserOf(
  source: { session?: object | null; user?: object | null } | null | undefined,
): RailsUser | null {
  if (!source?.session || !source.user) return null;
  const session = source.session as Record<string, unknown>;
  const user = source.user as Record<string, unknown>;
  return toRailsUser({
    accessToken: session.railsAccessToken,
    nickname: user.nickname,
    role: user.role,
  });
}
