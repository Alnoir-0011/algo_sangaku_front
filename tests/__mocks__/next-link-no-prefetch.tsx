"use client";

import OriginalLink from "next/dist/client/link";
import type { ComponentProps } from "react";

/**
 * E2E テスト用の `next/link` モック。
 *
 * Next.js はビューポートに入った <Link> を自動プリフェッチする。
 * テスト環境ではバックエンドが未起動のため、プリフェッチ先ページの SSR で
 * MSW ハンドラのない API への接続が発生しエラーログが出る。
 * prefetch={false} を強制することでプリフェッチを無効化する。
 * 差し替えは next.config.ts の webpack alias（APP_ENV=test）で行う。
 *
 * `next/dist/client/link` を直接インポートすることで、webpack alias による
 * 自己参照（無限ループ）を避けている。
 */
export default function NoPrefetchLink(
  props: ComponentProps<typeof OriginalLink>,
) {
  return <OriginalLink {...props} prefetch={false} />;
}
