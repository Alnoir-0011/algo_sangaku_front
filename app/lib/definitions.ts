// 並べ替え形式のコードブロック（issue #92 / back#278）。
// 作者・管理画面向けは correct_position を含む。解答者向けは含まない（`id`・`content` のみ）。
export type CodeBlock = {
  id: number;
  content: string;
  correct_position?: number | null;
};

// 解答者が並べ替え操作を行う画面（ReorderPuzzle）専用のブロック型。
// back は未解答者に correct_position を返さない契約だが、CodeBlock 型のまま
// Client Component へ渡すと、実際には correct_position が来ていなくても
// 型の上では持ちうる値として RSC のシリアライズ対象になり得る。
// id・content のみの型を用意し、解答画面の props がそもそも正解情報を
// 保持できないようにする（issue #92 quick-review 対応）。
export type PuzzleBlock = {
  id: number;
  content: string;
};

// 並べ替え形式の作成・更新時に back へ送信する code_blocks の 1 要素の型。
// CodeBlock（API レスポンス由来で id が必須）とは異なり、作成・更新時点では
// まだ id を持たないため専用の型として定義する。actions/sangaku.ts（ユーザー向け）と
// actions/admin.ts（管理画面向け）の両方から使うため、どちらにも属さない
// definitions.ts に置く（issue #92 quick-review 対応: 元は actions/sangaku.ts に
// あり、admin.ts がユーザー向けモジュールへ依存する非対称な形になっていた）。
export type ReorderCodeBlockInput = {
  content: string;
  correct_position: number | null;
};

export type Kind = "code" | "reorder";

// kind クエリパラメータの値を検証するための型ガード。Search.tsx（UI表示用）と
// data/sangaku.ts の appendKindParam（Server Action 経由で back に転送する前の
// ホワイトリスト検証）の両方から共有する（issue #92 quick-review 対応）。
export const isKind = (value: string): value is Kind =>
  value === "code" || value === "reorder";

export type Sangaku = {
  id: string;
  type: "sangaku";
  attributes: {
    title: string;
    description: string;
    source?: string;
    difficulty: Difficulty;
    inputs: Input[];
    author_name: string;
    // issue #92 / back#278: 出題形式。一覧・詳細どちらのレスポンスにも含まれる
    // （back の PublicSangakuSerializerAttributes で共通定義）。code_blocks は
    // 詳細レスポンスのみに含まれ、一覧では返らない。既存の消費箇所は無改修で
    // 通る想定の追加項目のため optional のままにしている
    kind?: Kind;
    code_blocks?: CodeBlock[];
  };
  relationships: {
    user: {
      data: {
        id: string;
        type: "user";
      } | null;
    };
    shrine: {
      data: {
        id: string;
        type: "shrine";
      } | null;
    };
  };
};

export type Difficulty = "easy" | "normal" | "difficult" | "very_difficult";

type Input = {
  id: number;
  content: string;
};

export type Shrine = {
  id: string;
  type: "shrine";
  attributes: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    place_id: string;
    sangaku_count?: number;
  };
};

type answerResultArray = { id: string; type: "answer_result" }[];

export type Answer = {
  id: string;
  type: "answer";
  attributes: {
    source: string | null;
    status: "correct" | "incorrect" | "pending";
    // issue #92 / back#278: 出題形式。並べ替え形式（reorder）では親の
    // Answer#source が nil になるため、source は string | null で表現する。
    // kind は optional: tests/components/answer/SourceResult.spec.tsx の
    // correctAnswer fixture（変更禁止）が kind を持たないため、必須化すると
    // その fixture の型チェックが壊れる。必須化するにはテスト側のfixture
    // 更新が必要（このリファクタでは対象外）。
    kind?: Kind;
  };
  relationships: {
    user_sangaku_save: {
      data: {
        id: string;
        type: "user_sangaku_save";
      };
    };
    answer_results: {
      data: answerResultArray;
    };
  };
};

export type AnswerResult = {
  id: string;
  type: "answer_result";
  attributes: {
    status: "correct" | "incorrect" | "pending";
    output: string;
    fixed_input_content: string;
  };
  relationships: {
    answer: {
      data: {
        id: string;
        type: "answer";
      };
    };
    fixed_input: {
      data: { id: string; type: "fixed_input" } | null;
    };
  };
};

export type User = {
  id: string;
  type: "user";
  attributes: {
    provider: "google";
    uid: string;
    name: string;
    email: string;
    nickname: string;
  };
};

export interface SangakuResult {
  attributes: {
    user_sangaku_save_count: number;
    correct_count: number;
    incorrect_count: number;
  };
}

export type AdminUser = {
  id: string;
  type: "user";
  attributes: {
    name: string;
    email: string;
    nickname: string;
    role: "general" | "admin";
    created_at: string;
    sangaku_count: number;
    answer_count: number;
  };
};

export type AdminSangaku = {
  id: string;
  type: "sangaku";
  attributes: {
    title: string;
    difficulty: Difficulty;
    created_at: string;
    user_name: string;
    shrine_name: string | null;
    description: string;
    // 並べ替え形式（kind === "reorder"）では back が source に null を返すため、
    // Answer 型の source と同様 string | null で表現する。
    source: string | null;
    // issue #92 / back#278: 出題形式。並べ替え形式は code_blocks を伴う。
    // Sangaku 型の同フィールドと同様、既存の消費箇所は無改修で通る想定の追加項目
    kind?: Kind;
    code_blocks?: CodeBlock[];
  };
};

export type AdminShrine = {
  id: string;
  type: "shrine";
  attributes: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    sangaku_count: number;
  };
};

export type AdminStats = {
  users_count: number;
  sangakus_count: number;
  shrines_count: number;
  answers_count: number;
};

export type GenerateSourceUsage = {
  used: number;
  limit: number;
  remaining: number;
  reset_at: string;
};

export type MyProfile = {
  id: string;
  type: "my_profile";
  attributes: {
    email: string;
    nickname: string;
    show_answer_count: boolean;
    created_at: string;
    sangaku_count: number;
    dedicated_sangaku_count: number;
    saved_sangaku_count: number;
    answer_count: number;
  };
};

export type PublicProfile = {
  id: string;
  type: "profile";
  attributes: {
    nickname: string;
    created_at: string;
    sangaku_count: number;
    dedicated_sangaku_count: number;
    answer_count: number | null;
    dedicated_sangakus: {
      id: number;
      title: string;
      shrine_name: string;
    }[];
  };
};
