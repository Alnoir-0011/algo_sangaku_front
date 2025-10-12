"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { setFlash } from "@/app/lib/actions/flash";
import { costomSignOut } from "./auth";
import { redirect } from "next/navigation";

const apiUrl = process.env.NEXT_PUBLIC_API_URL!;

export type State = {
  errors?: {
    source?: string[];
  };
  message?: string;
};

export const createAnswer = async (sangaku_id: string, source: string) => {
  const session = await auth();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.accessToken}`,
  };

  const params = {
    source,
  };

  try {
    const res = await fetch(
      `${apiUrl}/api/v1/user/sangakus/${sangaku_id}/answers`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(params),
      },
    );

    switch (res.status) {
      case 200:
        await setFlash({ type: "success", message: "算額を解答しました" });
        revalidatePath("/saved_sangakus");
        redirect(`/saved_sangakus/${sangaku_id}/answer`);
      case 401:
        await setFlash({
          type: "error",
          message:
            "セッションの有効期限が切れています。\n再度ログインしてください",
        });
        await costomSignOut();
        break;
      case 400:
        const data = await res.json();
        await setFlash({ type: "error", message: "入力に誤りがあります" });
        return {
          errors: Object.fromEntries(data.errors),
          message: "入力に誤りがあります",
        } as State;
      default:
        await setFlash({ type: "error", message: "リクエストに失敗しました" });
        return { message: "リクエストに失敗しました" } as State;
    }
  } catch (e) {
    if (isRedirectError(e)) {
      throw e;
    }
    await setFlash({ type: "error", message: "予期せぬエラーが発生しました" });
    return {
      message: "予期せぬエラーが発生しました",
    } as State;
  }
};
