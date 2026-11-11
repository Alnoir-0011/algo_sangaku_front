import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["tests/**"],
    rules: {
      // Playwright の fixture 引数 `use` を React Hook と誤検知する。
      // 特定ファイルだけ off にすると fixture を足すたびに同じ設定が要るため tests/** 全体で off にする。
      "react-hooks/rules-of-hooks": "off",
      // モックは本物の関数とシグネチャを揃える必要があり、未使用引数を削除できない。
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage-reports/**",
    "monocart-report/**",
    "playwright-report/**",
    "playwright/.cache/**",
    "test-results/**",
    "tests-examples/**",
  ]),
]);

export default eslintConfig;
