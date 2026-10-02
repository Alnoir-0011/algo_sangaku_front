import type { Sangaku } from "@/app/lib/definitions";

// back のレスポンスでは relationships.shrine は必須（未奉納でも { data: null }
// を返す）。ただし一部の既存テストダブルが shrine キー自体を省略しているため、
// shrine 自体が欠けている場合も安全側（未奉納）に倒して ?. で吸収する。
export function isDedicatedSangaku(sangaku: Sangaku): boolean {
  return sangaku.relationships.shrine?.data != null;
}
