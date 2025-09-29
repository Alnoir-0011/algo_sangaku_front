"use server";

import { auth, signOut } from "@/auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { setFlash } from "./flash";

const apiUrl = process.env.NEXT_PUBLIC_API_URL!;

export async function costomSignOut() {
  const session = await auth();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.accessToken}`,
  };

  try {
    await fetch(`${apiUrl}/api/v1/authenticate`, {
      method: "DELETE",
      headers,
    });
    await setFlash({ type: "success", message: "サインアウトしました" });
    await signOut({ redirectTo: "/signin" });
  } catch (e) {
    if (isRedirectError(e)) {
      throw e;
    }
  }
}
