export type Sangaku = {
  id: string;
  type: "sangaku";
  attributes: {
    title: string;
    description: string;
    source: string;
    difficulty: "easy" | "nomal" | "hard";
    inputs: input[];
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
