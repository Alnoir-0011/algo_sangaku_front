"use server";

import { serverFetch } from "@/app/lib/server-fetch";
import { isValidId } from "@/app/lib/validate-id";
import { validateBlockIds } from "@/app/lib/validate-answer-payload";

const apiUrl = process.env.API_URL!;

const REQUEST_FAILED_MESSAGE = "リクエストに失敗しました";
const UNEXPECTED_ERROR_MESSAGE = "予期せぬエラーが発生しました";

export type GuestAnswerResult =
  | { status: "correct" | "incorrect" }
  | { error: string };

export const submitGuestReorderAnswer = async (
  sangakuId: string,
  blockIds: number[],
): Promise<GuestAnswerResult> => {
  const validBlockIds = isValidId(sangakuId) ? validateBlockIds(blockIds) : null;
  if (!validBlockIds) {
    return { error: REQUEST_FAILED_MESSAGE };
  }

  try {
    const res = await serverFetch(
      `${apiUrl}/api/v1/public/reorder_sangakus/${encodeURIComponent(sangakuId)}/answer`,
      {
        method: "POST",
        body: JSON.stringify({ answer: { block_ids: validBlockIds } }),
      },
    );

    if (res.status !== 200) {
      return { error: REQUEST_FAILED_MESSAGE };
    }

    const data = await res.json();
    if (data?.status === "correct" || data?.status === "incorrect") {
      return { status: data.status };
    }
    return { error: UNEXPECTED_ERROR_MESSAGE };
  } catch {
    return { error: UNEXPECTED_ERROR_MESSAGE };
  }
};
