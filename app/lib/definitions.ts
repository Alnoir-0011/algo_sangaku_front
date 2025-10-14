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

export type Difficulty = "easy" | "nomal" | "difficult" | "very_difficult";

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
