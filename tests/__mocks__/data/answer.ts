import type { AnswerResult, Answer } from "@/app/lib/definitions";

export const fetchUserAnswerResult = async (
  _id: string,
): Promise<AnswerResult | null> => ({
  id: "1",
  type: "answer_result",
  attributes: {
    status: "correct",
    output: "mock output",
    fixed_input_content: "1",
  },
  relationships: {
    answer: { data: { id: "1", type: "answer" } },
    fixed_input: { data: { id: "1", type: "fixed_input" } },
  },
});

export const fetchUserAnswer = async (
  _id: string,
): Promise<Answer | null> => ({
  id: "1",
  type: "answer",
  attributes: {
    source: "puts 'hi'",
    status: "correct",
  },
  relationships: {
    user_sangaku_save: { data: { id: "1", type: "user_sangaku_save" } },
    answer_results: { data: [] },
  },
});
