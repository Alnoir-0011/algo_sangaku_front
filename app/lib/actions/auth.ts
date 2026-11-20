"use server";

import { setFlash } from "@/app/lib/set-flash";
import { signOutAndRedirect } from "@/app/lib/session";

// バックエンドの ApiKey の失効は、auth.ts の /sign-out フックが行う
export async function customSignOut() {
  await setFlash({ type: "success", message: "サインアウトしました" });
  await signOutAndRedirect("/signin");
}
