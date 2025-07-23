import { auth, signOut } from "@/auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import type { Sangaku } from "../definitions";
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export async function fetchUserSangakus() {
  const session = await auth();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.accessToken}`,
  };

  try {
    const res = await fetch(`${apiUrl}/api/v1/user/sangakus`, {
      headers,
    });

    switch (res.status) {
      case 200:
        const data = await res.json();
        const sangakus = data.data as Sangaku[];
        return sangakus;
      case 401:
        await signOut({ redirectTo: "/signin" });
      default:
        return {
          message: "リクエストに失敗しました",
        };
    }
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
  }
}
