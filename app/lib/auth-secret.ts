// Better Auth 本体は options.secret || BETTER_AUTH_SECRET || AUTH_SECRET の順で解決し、
// 空文字を未設定として扱う。?? では空文字が通ってしまい、Better Auth と食い違うため、
// 認証（auth.ts）、rails_session の暗号化、ガードのレート制限のキーの HMAC は、
// すべてここを使って同じ順序にそろえる。
// next/headers などに依存しないため、どこからでも読み込める
export const resolveAuthSecret = () =>
  process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET;
