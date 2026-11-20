// コンポーネントテスト用のセッションの型と、Better Auth の get-session の応答への変換。
// ログイン中の利用者の見た目だけを再現するため、必要な項目に絞っている
export type TestSession = {
  user: { name?: string; email?: string; image?: string };
  expires?: string;
};

const FAR_FUTURE = "2999-01-01T00:00:00.000Z";
const EPOCH = "2026-01-01T00:00:00.000Z";

// get-session は、未ログインのとき null、ログイン中は { session, user } を返す
export const toBetterAuthSession = (session: TestSession | null) =>
  session === null
    ? null
    : {
        session: {
          id: "test-session",
          token: "test-token",
          userId: "test-user",
          expiresAt: FAR_FUTURE,
          createdAt: EPOCH,
          updatedAt: EPOCH,
        },
        user: {
          id: "test-user",
          name: session.user.name ?? "",
          email: session.user.email ?? "",
          image: session.user.image ?? null,
          emailVerified: true,
          createdAt: EPOCH,
          updatedAt: EPOCH,
        },
      };
