"use server";

import { redirect } from "next/navigation";
import { APIError } from "better-auth/api";

import { auth } from "@/auth";
import { requestHeaders } from "@/app/lib/session";

// E2E 専用のサインイン。旧 Credentials プロバイダーと同じ条件・同じ固定値にしている。
// Server Action は公開エンドポイントになるため、テスト環境以外では中身を実行しない
const TEST_PASSWORD = "password";
const TEST_ADMIN_EMAIL = "admin_user@example.com";

export async function testSignIn(formData: FormData) {
  if (process.env.APP_ENV !== "test") throw new Error("Not found");

  const email = formData.get("email");
  const password = formData.get("password");
  if (typeof email !== "string" || email === "" || password !== TEST_PASSWORD) {
    redirect("/signin?error=credentials");
  }

  const headers = await requestHeaders();
  // ステートレス（メモリアダプター）のため、利用者はテストごとに作る。
  // 同じメールで 2 回目以降は、サインアップが重複するので、サインインを先に試す。
  // Rails の項目は、サインアップ時に user の記録へ入れる（同じメールなら同じ値になる）
  // 握るのは、利用者がまだいない場合の 401 だけ。ほかの失敗を握ると、続くサインアップが
  // 重複で投げ、元の原因が隠れる
  const signedIn = await auth.api
    .signInEmail({ body: { email, password }, headers })
    .catch((error: unknown) => {
      if (error instanceof APIError && error.statusCode === 401) return null;
      throw error;
    });
  if (!signedIn) {
    try {
      await auth.api.signUpEmail({
        body: {
          email,
          password,
          name: email,
          railsAccessToken: "dummy_token",
          nickname: "test_nickname",
          role: email.toLowerCase() === TEST_ADMIN_EMAIL ? "admin" : "general",
        },
        headers,
      });
    } catch (error) {
      // 並列のテストが、同じメール（固定の管理者など）で同時に初めてサインインすると、
      // 両方がサインアップに進み、後から来た側が重複で失敗する。その場合は、サインインし直す
      const isRace =
        error instanceof APIError &&
        error.body?.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL";
      if (!isRace) throw error;
      await auth.api.signInEmail({ body: { email, password }, headers });
    }
  }
  redirect("/");
}
