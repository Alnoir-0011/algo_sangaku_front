"use server";

import { auth, signOut } from "@/auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { setFlash } from "./flash";
import { serverFetch } from "@/app/lib/server-fetch";

const apiUrl = process.env.API_URL!;

export async function customSignOut() {
  const session = await auth();

  try {
    await serverFetch(`${apiUrl}/api/v1/authenticate`, {
      method: "DELETE",
      token: session?.accessToken,
    });
    await setFlash({ type: "success", message: "サインアウトしました" });
    await signOut({ redirectTo: "/signin" });
  } catch (e) {
    if (isRedirectError(e)) {
      throw e;
    }
  }
}
