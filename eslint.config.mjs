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
  {
    // 本番のコードが、テスト用のコードやテスト用のプラグインに依存すると、特権のヘルパー
    // （ctx.test）や、テスト用の入口が、本番に入る
    files: ["app/**", "auth.ts", "proxy.ts", "routes.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/tests/*", "**/tests/**"],
              message: "本番のコードから、tests/ を import しない。",
            },
          ],
          paths: [
            {
              name: "better-auth/plugins",
              importNames: ["testUtils"],
              message:
                "testUtils は、テスト用の認証のインスタンス（tests/__helpers__/test-auth.ts）にだけ入れる。",
            },
          ],
        },
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
