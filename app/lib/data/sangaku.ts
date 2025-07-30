import { auth, signOut } from "@/auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import type { Sangaku } from "../definitions";
import { setFlash } from "../actions/flash";
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export async function fetchUserSangakus(page: string) {
  const session = await auth();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.accessToken}`,
  };

  try {
    const res = await fetch(
      `${apiUrl}/api/v1/user/sangakus?shrine_id=&page=${page}`,
      {
        headers,
      },
    );

    switch (res.status) {
      case 200:
        const totalPage = parseInt(res.headers.get("total-pages")!);
        const data = await res.json();
        const sangakus = data.data as Sangaku[];
        return { sangakus, totalPage };
      case 401:
        await signOut({ redirectTo: "/signin" });
      default:
        await setFlash({ type: "error", message: "リクエストに失敗しました" });
        return { sangakus: [], totalPage: 0, currentPage: 0 };
    }
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    await setFlash({ type: "error", message: "予期せぬエラーが発生しました" });
    return { sangakus: [], totalPage: 0, currentPage: 0 };
  }
}
