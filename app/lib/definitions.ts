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
