import type { Answer } from "@/app/lib/definitions";

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
