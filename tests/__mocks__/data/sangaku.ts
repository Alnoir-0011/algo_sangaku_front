import type { SangakuResult } from "@/app/lib/definitions";

export const fetchUserSangakus = async () => ({
  data: [],
  meta: { total_pages: 1 },
});

export const fetchUserSangakuResult = async (
  _id: string,
): Promise<SangakuResult | null> => ({
  attributes: {
    user_sangaku_save_count: 5,
    correct_count: 3,
    incorrect_count: 2,
  },
});

export const fetchShrineSangakus = async () => ({ data: [] });

export const fetchSavedSangakus = async () => ({ data: [] });
