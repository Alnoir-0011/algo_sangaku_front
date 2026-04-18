"use server";

import { auth, unstable_update } from "@/auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { setFlash } from "@/app/lib/actions/flash";
import { customSignOut } from "./auth";
import { User } from "../definitions";
import { buildHeaders } from "@/app/lib/client_headers";

const apiUrl = process.env.API_URL!;

export type State = {
  errors?: {
    nickname?: string[];
  };
  values?: {
    nickname?: string;
  };
  message?: string;
};

export const updateProfile = async (_prevState: State, formData: FormData) => {
  const session = await auth();
  const user = session?.user;

  const raw = formData.get("nickname");
  const nickname = typeof raw === "string" ? raw : undefined;

  const params = {
    user: { nickname },
  };

  try {
    const res = await fetch(`${apiUrl}/api/v1/user/profile`, {
      method: "PATCH",
      headers: buildHeaders(session?.accessToken),
      body: JSON.stringify(params),
    });

    switch (res.status) {
      case 200:
        const userData = (await res.json()).data as User;
        const newNickname = userData.attributes.nickname;
        await unstable_update({ user: { ...user, nickname: newNickname } });
        await setFlash({
          type: "success",
          message: "プロフィールを更新しました",
        });
        revalidatePath("/user/profile");
        redirect("/user/profile");
      case 401:
        await setFlash({
          type: "error",
          message:
            "セッションの有効期限が切れています。\n再度サインインしてください",
        });
        await customSignOut();
        return {} as State;
      case 400:
        const data = await res.json();
        await setFlash({ type: "error", message: "入力に誤りがあります" });
        const errors = Array.isArray(data.errors)
          ? Object.fromEntries(data.errors)
          : {};
        return {
          errors,
          values: { nickname },
        } as State;
      default:
        await setFlash({ type: "error", message: "リクエストに失敗しました" });
        return {
          values: { nickname },
        } as State;
    }
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    await setFlash({ type: "error", message: "予期せぬエラーが発生しました" });
    return {
      values: { nickname },
    } as State;
  }
};

export const updateShowAnswerCount = async (
  showAnswerCount: boolean,
): Promise<{ success: boolean }> => {
  const session = await auth();

  try {
    const res = await fetch(`${apiUrl}/api/v1/user/profile`, {
      method: "PATCH",
      headers: buildHeaders(session?.accessToken),
      body: JSON.stringify({ user: { show_answer_count: showAnswerCount } }),
    });

    if (res.status === 200) {
      await setFlash({ type: "success", message: "プライバシー設定を更新しました" });
      return { success: true };
    }
    if (res.status === 401) {
      await customSignOut();
    }
    await setFlash({ type: "error", message: "設定の更新に失敗しました" });
    return { success: false };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    await setFlash({ type: "error", message: "予期せぬエラーが発生しました" });
    return { success: false };
  }
};
