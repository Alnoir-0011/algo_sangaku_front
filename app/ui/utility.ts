export const difficultyTranslation = (str: string) => {
  switch (str) {
    case "easy":
      return "簡単";
    case "nomal":
      return "普通";
    case "difficult":
      return "難しい";
    default:
      return "とても難しい";
  }
};
