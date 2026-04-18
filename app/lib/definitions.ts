export type Sangaku = {
  id: string;
  type: "sangaku";
  attributes: {
    title: string;
    description: string;
    source: string;
    difficulty: Difficulty;
    inputs: input[];
    author_name: string;
  };
  relationships: {
    user: {
      data: {
        id: string;
        type: "user";
      };
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

type input = {
  id: number;
  content: string;
};

export type Shrine = {
  id: string;
  type: "shrine";
  attributes: {
    name: string;
    address: string;
    latitude: string;
    longitude: string;
    place_id: string;
  };
};

type answerResultArray = { id: string; type: "answer_result" }[];

export type Answer = {
  id: string;
  type: "answer";
  attributes: {
    source: string;
    status: "correct" | "incorrect" | "pending";
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
