import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const summaryPath = resolve(
  __dirname,
  "../coverage-reports/e2e/v8/coverage-summary.json",
);

const THRESHOLD = 80;
const METRICS = ["statements", "branches", "functions", "lines"];

let summary;
try {
  summary = JSON.parse(readFileSync(summaryPath, "utf-8"));
} catch {
  console.error(`Failed to read coverage summary: ${summaryPath}`);
  process.exit(1);
}

const totals = summary.total;
const errors = [];

for (const metric of METRICS) {
  const pct = totals?.[metric]?.pct;
  if (pct === undefined) {
    errors.push(`Coverage metric "${metric}" not found in summary`);
    continue;
  }
  if (pct < THRESHOLD) {
    errors.push(
      `Coverage threshold for ${metric} (${pct}%) not met: ${THRESHOLD}%`,
    );
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`All coverage thresholds met (>= ${THRESHOLD}%)`);
