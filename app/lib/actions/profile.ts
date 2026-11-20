"use server";

import {
  getSession,
  signOutAndRedirect,
  updateSessionNickname,
} from "@/app/lib/session";
import { signinPath } from "@/routes";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { setFlash } from "@/app/lib/set-flash";
import { User } from "../definitions";
import { serverFetch } from "@/app/lib/server-fetch";
import { parseApiErrors } from "@/app/lib/parse-api-errors";
import { SESSION_EXPIRED_MESSAGE } from "@/app/lib/constants";

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
  const session = await getSession();

  const raw = formData.get("nickname");
  const nickname = typeof raw === "string" ? raw : undefined;

  const params = {
    user: { nickname },
  };

  try {
    const res = await serverFetch(`${apiUrl}/api/v1/user/profile`, {
      method: "PATCH",
      token: session?.accessToken,
      body: JSON.stringify(params),
    });

    switch (res.status) {
      case 200: {
        const userData = (await res.json()).data as User;
        const newNickname = userData.attributes.nickname;
        // Rails では、すでに更新済み。ここで失敗しても、cookie の nickname が古いだけで、
        // 再サインインで直る。「更新できなかった」と表示すると、再送信しても変わらない更新になる
        try {
          await updateSessionNickname(newNickname);
        } catch (error) {
          console.error("[profile] failed to update the session:", error);
        }
        await setFlash({
          type: "success",
          message: "プロフィールを更新しました",
        });
        revalidatePath("/user/profile");
        redirect("/user/profile");
      }
      case 401:
        await setFlash({
          type: "error",
          message: SESSION_EXPIRED_MESSAGE,
        });
        await signOutAndRedirect(signinPath, { revokeApiKey: false });
        return {} as State;
      case 400:
        const data = await res.json();
        await setFlash({ type: "error", message: "入力に誤りがあります" });
        return {
          errors: parseApiErrors(data.errors),
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
  const session = await getSession();

  try {
    const res = await serverFetch(`${apiUrl}/api/v1/user/profile`, {
      method: "PATCH",
      token: session?.accessToken,
      body: JSON.stringify({ user: { show_answer_count: showAnswerCount } }),
    });

    if (res.status === 200) {
      await setFlash({ type: "success", message: "プライバシー設定を更新しました" });
      return { success: true };
    }
    if (res.status === 401) {
      await setFlash({
        type: "error",
        message: SESSION_EXPIRED_MESSAGE,
      });
      await signOutAndRedirect(signinPath, { revokeApiKey: false });
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
