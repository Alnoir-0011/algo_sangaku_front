"use server";

import { auth, signOut } from "@/auth";
import { setFlash } from "@/app/lib/set-flash";
import { serverFetch } from "@/app/lib/server-fetch";

const apiUrl = process.env.API_URL!;

// ベストエフォートの副作用なので、バックエンドがハングしていてもサインアウトを待たせない
const BACKEND_SIGN_OUT_TIMEOUT_MS = 3_000;

// バックエンドの DELETE が失敗しても front のサインアウトは止めない。
// 止めると、バックエンド障害中は利用者がサインアウトできなくなる
export async function customSignOut() {
  const session = await auth();

  // トークンがなければ、必ず 401 になる DELETE は送らない
  if (session?.accessToken) {
    try {
      const response = await serverFetch(`${apiUrl}/api/v1/authenticate`, {
        method: "DELETE",
        token: session.accessToken,
        timeoutMs: BACKEND_SIGN_OUT_TIMEOUT_MS,
      });
      // 401 は ApiKey がすでに無効という意味で、障害ではない。error に混ぜると本当の失敗が埋もれる
      if (!response.ok && response.status !== 401) {
        console.error("[auth] backend sign-out failed:", response.status);
      }
    } catch (error) {
      console.error("[auth] backend sign-out failed:", error);
    }
  }

  await setFlash({ type: "success", message: "サインアウトしました" });
  await signOut({ redirectTo: "/signin" });
}
