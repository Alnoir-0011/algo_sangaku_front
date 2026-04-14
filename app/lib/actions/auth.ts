"use server";

import { auth, signOut } from "@/auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { setFlash } from "./flash";
import { buildHeaders } from "@/app/lib/client_headers";

const apiUrl = process.env.NEXT_PUBLIC_API_URL!;

export async function customSignOut() {
  const session = await auth();

  try {
    await fetch(`${apiUrl}/api/v1/authenticate`, {
      method: "DELETE",
      headers: buildHeaders(session?.accessToken),
    });
    await setFlash({ type: "success", message: "サインアウトしました" });
    await signOut({ redirectTo: "/signin" });
  } catch (e) {
    if (isRedirectError(e)) {
      throw e;
    }
  }
}
