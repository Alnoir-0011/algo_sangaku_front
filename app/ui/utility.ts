import type { Kind } from "@/app/lib/definitions";

export const difficultyTranslation = (str: string) => {
  switch (str) {
    case "easy":
      return "簡単";
    case "normal":
      return "普通";
    case "difficult":
      return "難しい";
    default:
      return "とても難しい";
  }
};

export const kindTranslation = (kind: Kind) => {
  switch (kind) {
    case "reorder":
      return "並べ替え";
    case "code":
      return "コード記述";
  }
};
