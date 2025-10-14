"use server";

import { auth, unstable_update } from "@/auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { setFlash } from "@/app/lib/actions/flash";
import { costomSignOut } from "./auth";
import { User } from "../definitions";

const apiUrl = process.env.NEXT_PUBLIC_API_URL!;

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

  const nickname = formData.get("nickname");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.accessToken}`,
  };

  const params = {
    user: { nickname },
  };

  try {
    const res = await fetch(`${apiUrl}/api/v1/user/profile`, {
      method: "PATCH",
      headers,
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
        redirect("/");
      case 401:
        await setFlash({
          type: "error",
          message:
            "セッションの有効期限が切れています。\n再度サインインしてください",
        });
        await costomSignOut();
        return {} as State;
      case 400:
        const data = await res.json();
        await setFlash({ type: "error", message: "入力に誤りがあります" });
        return {
          errors: Object.fromEntries(data.errors),
          // message: "入力に誤りがあります",
          values: { nickname },
        } as State;
      default:
        await setFlash({ type: "error", message: "リクエストに失敗しました" });
        return {
          // message: "リクエストに失敗しました",
          values: { nickname },
        } as State;
    }
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    await setFlash({ type: "error", message: "予期せぬエラーが発生しました" });
    return {
      // message: "予期せぬエラーが発生しました",
      values: { nickname },
    } as State;
  }
};
