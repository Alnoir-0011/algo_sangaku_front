"use server";

import { auth } from "@/auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { setFlash } from "./flash";
import { revalidatePath } from "next/cache";
import { customSignOut } from "./auth";
import { buildHeaders } from "@/app/lib/client_headers";

const apiUrl = process.env.API_URL!;

export async function dedicateSangaku(
  shrine_id: string,
  sangaku_id: string,
  location: { lat: number; lng: number },
) {
  const session = await auth();
  const params = { shrine_id, ...location };

  try {
    const res = await fetch(
      `${apiUrl}/api/v1/user/sangakus/${sangaku_id}/dedicate`,
      {
        method: "POST",
        headers: buildHeaders(session?.accessToken),
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
        await customSignOut();
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

  try {
    const res = await fetch(`${apiUrl}/api/v1/sangakus/${sangaku_id}/save`, {
      method: "POST",
      headers: buildHeaders(session?.accessToken),
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
        await customSignOut();
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
