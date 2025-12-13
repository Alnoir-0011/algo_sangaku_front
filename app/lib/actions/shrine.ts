"use server";

import { auth } from "@/auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { setFlash } from "./flash";
import { revalidatePath } from "next/cache";
import { costomSignOut } from "./auth";

const apiUrl = process.env.NEXT_PUBLIC_API_URL!;

export async function dedicateSangaku(
  shrine_id: string,
  sangaku_id: string,
  location: { lat: number; lng: number },
) {
  const session = await auth();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.accessToken}`,
  };

  const params = { shrine_id, ...location };

  try {
    const res = await fetch(
      `${apiUrl}/api/v1/user/sangakus/${sangaku_id}/dedicate`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(params),
      },
    );

    switch (res.status) {
      case 200:
        await setFlash({ type: "success", message: "算額を奉納しました" });
        revalidatePath("/user/sangakus");
        return true;
      case 401:
        await setFlash({
          type: "error",
          message:
            "セッションの有効期限が切れています。\n再度ログインしてください",
        });
        await costomSignOut();
        return false;
      default:
        await setFlash({ type: "error", message: "リクエストに失敗しました" });
        return false;
    }
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    await setFlash({ type: "error", message: "予期せぬエラーが発生しました" });
    return false;
  }
}

export async function createSangakuSave(sangaku_id: string) {
  const session = await auth();
  if (!session) {
    setFlash({ type: "error", message: "サインインしてください" });
    return null;
  }
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.accessToken}`,
  };

  try {
    const res = await fetch(`${apiUrl}/api/v1/sangakus/${sangaku_id}/save`, {
      method: "POST",
      headers,
    });

    switch (res.status) {
      case 200:
        await setFlash({
          type: "success",
          message: "算額の写しを作成しました",
        });
        // revalidatePath("/user/saved_sangakus");
        break;
      case 401:
        await setFlash({
          type: "error",
          message:
            "セッションの有効期限が切れています。\n再度ログインしてください",
        });
        await costomSignOut();
      default:
        await setFlash({ type: "error", message: "リクエストに失敗しました" });
    }
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    await setFlash({ type: "error", message: "予期せぬエラーが発生しました" });
  }
}
