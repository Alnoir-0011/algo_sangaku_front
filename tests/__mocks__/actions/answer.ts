// createAnswer の呼び出し引数を記録するための型。
// ReorderPuzzle.spec.tsx はこの記録を page.evaluate 経由で読み取り、
// 「解答を終了する」ボタンから block_ids がどう渡されたかを検証する。
// admin.ts の updateSangaku モックと同じ「呼び出し記録をグローバルに積む」方式。
export type State = {
  errors?: {
    source?: string[];
  };
  message?: string;
};

export type AnswerPayload = { source: string } | { block_ids: number[] };

export type CreateAnswerCall = {
  sangakuId: string;
  payload: AnswerPayload;
};

declare global {
  interface Window {
    __createAnswerCalls?: CreateAnswerCall[];
  }
}

export const createAnswer = async (
  sangakuId: string,
  payload: AnswerPayload,
): Promise<State> => {
  window.__createAnswerCalls = window.__createAnswerCalls ?? [];
  window.__createAnswerCalls.push({ sangakuId, payload });
  return {};
};
