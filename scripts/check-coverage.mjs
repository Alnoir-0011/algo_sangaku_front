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

const nf = (n) => Number(n).toLocaleString("en-US");
const pf = (n) => `${Number(n).toFixed(2)} %`;

const rows = METRICS.map((metric) => {
  const { total, covered, pct } = totals[metric] ?? {};
  const uncovered = total - covered;
  return [capitalize(metric), pf(pct), nf(covered), nf(uncovered), nf(total)];
});

console.log(renderTable(["Name", "Coverage %", "Covered", "Uncovered", "Total"], rows));

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

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function renderTable(headers, rows) {
  const allRows = [headers, ...rows];
  const colCount = headers.length;

  const widths = Array.from({ length: colCount }, (_, i) =>
    Math.max(...allRows.map((r) => String(r[i]).length)),
  );

  const hr = (l, m, r) =>
    l + widths.map((w) => "─".repeat(w + 2)).join(m) + r;

  const dataRow = (cells) =>
    "│" +
    cells
      .map((c, i) =>
        i === 0
          ? ` ${String(c).padEnd(widths[i])} `
          : ` ${String(c).padStart(widths[i])} `,
      )
      .join("│") +
    "│";

  return [
    hr("┌", "┬", "┐"),
    dataRow(headers),
    hr("├", "┼", "┤"),
    ...rows.map(dataRow),
    hr("└", "┴", "┘"),
  ].join("\n");
}
