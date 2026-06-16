import { merge } from "monocart-reporter";

// プロジェクト規約（CLAUDE.md）の新規コードカバレッジ要件に合わせた閾値
const thresholds = {
  statements: 80,
  branches: 80,
  functions: 80,
  lines: 80,
};

try {
  await merge(
    ["./coverage-reports/ct/index.json", "./coverage-reports/e2e/index.json"],
    {
      name: "Merged Coverage Report (CT + E2E Chromium)",
      outputFile: "./coverage-reports/merged/index.html",
      coverage: {
        outputDir: "./coverage-reports/merged/v8",
        reports: ["v8", "console-summary"],
        // monocart の entryFilter/sourceFilter はオブジェクトキーの定義順で
        // 先勝ち判定（最初にマッチしたキーの値が採用される）。順序を変えないこと。
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
            // レポートに指標自体が存在しない場合は閾値チェックをスキップせず、
            // 異常として検知する（黙って成功扱いにしない）
            if (pct === undefined) {
              errors.push(`Coverage metric "${metric}" not found in summary`);
              continue;
            }
            if (pct < threshold) {
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
} catch (err) {
  console.error("Failed to merge coverage reports:", err);
  process.exitCode = 1;
}
