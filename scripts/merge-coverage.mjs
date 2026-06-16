import { merge } from "monocart-reporter";

// プロジェクト規約（CLAUDE.md）の新規コードカバレッジ要件に合わせた閾値
const thresholds = {
  statements: 80,
  branches: 80,
  functions: 80,
  lines: 80,
};

await merge(
  ["./coverage-reports/ct/index.json", "./coverage-reports/e2e/index.json"],
  {
    name: "Merged Coverage Report (CT + E2E Chromium)",
    outputFile: "./coverage-reports/merged/index.html",
    coverage: {
      outputDir: "./coverage-reports/merged/v8",
      reports: ["v8", "console-summary"],
      entryFilter: {
        "localhost:4020/_next/static/": true,
        "localhost:4020": false,
        "**": true,
      },
      sourceFilter: {
        "node_modules": false,
        "tests/": false,
        "app/": true,
        "theme.ts": true,
      },
      onEnd: (results) => {
        const errors = [];
        const { summary } = results;
        for (const [metric, threshold] of Object.entries(thresholds)) {
          const pct = summary[metric]?.pct;
          if (pct !== undefined && pct < threshold) {
            errors.push(
              `Coverage threshold for ${metric} (${pct}%) not met: ${threshold}%`,
            );
          }
        }
        if (errors.length) {
          console.error(errors.join("\n"));
          process.exitCode = 1;
        }
      },
    },
  },
);
