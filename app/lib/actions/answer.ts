"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { setFlash } from "@/app/lib/actions/flash";
import { customSignOut } from "./auth";
import { redirect } from "next/navigation";
import { serverFetch } from "@/app/lib/server-fetch";
import { parseApiErrors } from "@/app/lib/parse-api-errors";
import { isValidId } from "@/app/lib/validate-id";

const apiUrl = process.env.API_URL!;

export type State = {
  errors?: {
    source?: string[];
  };
  message?: string;
};

export type AnswerPayload = { source: string } | { block_ids: number[] };

// back の Answer#source / ReorderSangaku::MAX_CODE_BLOCKS と同値。
// Server Action は "use server" により公開HTTPエンドポイントになるため、
// クライアントの型注釈（union型）は実行時には何も守らない。UIを経由しない
// 直接呼び出し（形の不正なペイロード）を back に転送する前に弾く
const MAX_SOURCE_LENGTH = 65_535;
const MAX_BLOCK_IDS = 100;

// 検証済みの payload のみを返す。"source" と "block_ids" の両方を含む
// オブジェクトを直接渡された場合でも、判定に使った側のフィールドだけを
// 転送し、もう片方の未検証フィールドが素通りしないようにする
// （payload をそのまま転送すると union の排他性を保証できない）。
function validateAnswerPayload(payload: unknown): AnswerPayload | null {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  if ("source" in payload) {
    const { source } = payload as { source: unknown };
    if (typeof source === "string" && source.length <= MAX_SOURCE_LENGTH) {
      return { source };
    }
    return null;
  }

  if ("block_ids" in payload) {
    const { block_ids } = payload as { block_ids: unknown };
    const isValid =
      Array.isArray(block_ids) &&
      block_ids.length > 0 &&
      block_ids.length <= MAX_BLOCK_IDS &&
      block_ids.every((id) => Number.isInteger(id) && id > 0) &&
      new Set(block_ids).size === block_ids.length;
    return isValid ? { block_ids: block_ids as number[] } : null;
  }

  return null;
}

export const createAnswer = async (
  sangaku_id: string,
  payload: AnswerPayload,
) => {
  const session = await auth();

  const validPayload = isValidId(sangaku_id)
    ? validateAnswerPayload(payload)
    : null;
  if (!validPayload) {
    await setFlash({ type: "error", message: "リクエストに失敗しました" });
    return { message: "リクエストに失敗しました" } as State;
  }

  const params = { answer: validPayload };

  try {
    const res = await serverFetch(
      `${apiUrl}/api/v1/user/saved_sangakus/${encodeURIComponent(sangaku_id)}/answer`,
      {
        method: "POST",
        token: session?.accessToken,
        body: JSON.stringify(params),
      },
    );

    switch (res.status) {
      case 200:
        await setFlash({ type: "success", message: "算額を解答しました" });
        revalidatePath("/saved_sangakus");
        redirect(`/saved_sangakus/${sangaku_id}/answer`); // 必ず throw するため case 401 へは落ちない
      case 401:
        await setFlash({
          type: "error",
          message:
            "セッションの有効期限が切れています。\n再度ログインしてください",
        });
        await customSignOut();
        break;
      case 400:
        const data = await res.json();
        await setFlash({ type: "error", message: "入力に誤りがあります" });
        return {
          errors: parseApiErrors(data.errors),
          message: "入力に誤りがあります",
        } as State;
      case 409:
        await setFlash({
          type: "error",
          message: "この算額にはすでに解答済みです",
        });
        return { message: "この算額にはすでに解答済みです" } as State;
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
