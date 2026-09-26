// submitGuestReorderAnswer の呼び出し引数を記録し、戻り値をテストから差し替えられるモック。
// answer.ts の __createAnswerCalls 方式に合わせて呼び出しを window に積む。
// 戻り値は window.__guestAnswerResponses のキューから先頭を取り出して返す。
// キューが空（未設定）のときは { status: "correct" } を返す。
export type GuestAnswerResult =
  | { status: "correct" | "incorrect" }
  | { error: string };

export type GuestAnswerCall = {
  sangakuId: string;
  blockIds: number[];
};

declare global {
  interface Window {
    __guestAnswerCalls?: GuestAnswerCall[];
    __guestAnswerResponses?: GuestAnswerResult[];
  }
}

export const submitGuestReorderAnswer = async (
  sangakuId: string,
  blockIds: number[],
): Promise<GuestAnswerResult> => {
  window.__guestAnswerCalls = window.__guestAnswerCalls ?? [];
  window.__guestAnswerCalls.push({ sangakuId, blockIds });
  const next = window.__guestAnswerResponses?.shift();
  return next ?? { status: "correct" };
};
