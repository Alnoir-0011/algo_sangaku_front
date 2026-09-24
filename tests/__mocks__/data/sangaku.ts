import type { Sangaku, SangakuResult } from "@/app/lib/definitions";

export const fetchUserSangakus = async () => ({
  data: [],
  meta: { total_pages: 1 },
});

// ConfirmModal（kind: "reorder"）が詳細APIから code_blocks を取得する挙動を
// 検証するための固定フィクスチャ。他の *_id を無視する既存モック
// （fetchUserAnswer, fetchShrine 等）と同様、id によらず固定値を返す。
// code_blocks は back のシリアライザ（OrderedCodeBlocksAttribute）が返す並び順
// （正解ブロックを correct_position 昇順→ダミーを id 昇順）を模して並べている。
export const fetchUserSangaku = async (_id: string): Promise<Sangaku | null> => ({
  id: "2",
  type: "sangaku",
  attributes: {
    title: "reorder_detail_title",
    description: "reorder_detail_desc",
    difficulty: "normal",
    kind: "reorder",
    inputs: [],
    author_name: "test_author",
    code_blocks: [
      { id: 10, content: "block_content_1", correct_position: 1 },
      { id: 11, content: "block_content_2", correct_position: 2 },
      { id: 12, content: "dummy_block_content", correct_position: null },
    ],
  },
  relationships: {
    user: { data: { id: "1", type: "user" } },
    shrine: { data: null },
  },
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
