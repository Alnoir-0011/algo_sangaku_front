import { transformSync } from "@babel/core";
import path from "path";

const appDir = path.resolve(__dirname, "../app") + path.sep;

// Playwright CT は React 用の Vite プラグインを固定の設定で生成するため、そこに Babel の
// プラグインを足せない。Next（next.config.ts の reactCompiler）と同じ変換を CT にも
// かけるために、別のプラグインで app/ だけを変換する。
// panicThreshold は指定しない。"all_errors" にすると、コンパイラが未対応の構文（finally など）で
// ビルドが落ちる。Next の既定どおり、その関数だけを変換せずに残す。
export function reactCompiler() {
  return {
    name: "react-compiler",
    enforce: "pre" as const,
    transform(code: string, id: string) {
      const file = id.split("?")[0];
      if (!file.startsWith(appDir) || !/\.[jt]sx?$/.test(file)) {
        return null;
      }

      const result = transformSync(code, {
        filename: file,
        babelrc: false,
        configFile: false,
        sourceMaps: true,
        parserOpts: { plugins: ["typescript", "jsx"] },
        plugins: ["babel-plugin-react-compiler"],
      });

      if (!result?.code) {
        return null;
      }
      return { code: result.code, map: result.map };
    },
  };
}
