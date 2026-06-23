import type { NextConfig } from "next";
import path from "path";

const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  // HSTS は HTTPS 環境（本番）のみ有効化する
  ...(process.env.NODE_ENV === "production"
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
  // CSP はテスト環境を除いて設定する
  // （Monaco Editor の WebWorker と CSP の互換性確保が複雑なため、テスト時は除外）
  ...(process.env.APP_ENV !== "test"
    ? [
        {
          // Emotion の inline style・Monaco Editor・Google Maps との兼ね合いで
          // style-src / script-src に 'unsafe-inline' を許容する保守的 CSP。
          // unsafe-eval: Monaco Editor の Worker 生成時に new Function を使うため必要。 将来的には monaco-editor の ESM Worker モードへ移行することで除去できる。 unsafe-inline: Emotion が実行時に <style> をインジェクトするため必要。 将来的には nonce ベースに移行することで除去できる。
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            // object-src: Flash/プラグイン経由の XSS を防ぐ（default-src では不十分）
            "object-src 'none'",
            // base-uri: <base> タグ注入によるリソースハイジャック防止（default-src 非継承）
            "base-uri 'self'",
            // form-action: フォーム送信先の乗っ取り防止（default-src 非継承）
            "form-action 'self'",
            // frame-ancestors: クリックジャッキング対策（X-Frame-Options より優先される）
            "frame-ancestors 'self'",
            // Emotion が <style> タグをインジェクトするため unsafe-inline が必要
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
            // Monaco Editor が blob: WebWorker / new Function を使うため unsafe-eval / blob: が必要
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://maps.googleapis.com https://www.googletagmanager.com https://cdn.jsdelivr.net",
            "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net",
            // Google Maps タイル・静的画像・Google/GitHub アバター
            // lh3.googleusercontent.com: Google OAuth ユーザーのアバター配信ドメイン
            "img-src 'self' data: blob: https://*.googleapis.com https://*.gstatic.com https://lh3.googleusercontent.com https://avatars.githubusercontent.com",
            // connect-src: サーバーサイド fetch（Server Actions）はブラウザ CSP 対象外。
            // クライアントサイドでの GA ビーコン送信に必要なドメインを追加。
            "connect-src 'self' https://maps.googleapis.com https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com https://cdn.jsdelivr.net",
            // Monaco Editor が blob: URI で WebWorker を生成するため blob: が必要
            "worker-src 'self' blob: https://cdn.jsdelivr.net",
            // Google Maps iframe
            "frame-src https://www.google.com",
          ].join("; "),
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  // COVERAGE はテスト実行時（CI の build ジョブ・ローカル E2E）のみ "true" になる想定。
  // 本番デプロイ用のビルド/ワークフローでこの変数を継承しないこと
  // （ソースマップにソースコードが埋め込まれ公開される）。
  productionBrowserSourceMaps: process.env.COVERAGE === "true",
  experimental: {
    testProxy: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  webpack: (config) => {
    // E2E テスト時は実 Google Maps をロードせずモックに差し替える
    if (process.env.E2E_MOCK_MAPS === "true") {
      config.resolve.alias = {
        ...config.resolve.alias,
        "@vis.gl/react-google-maps": path.resolve(
          __dirname,
          "tests/__mocks__/react-google-maps.tsx",
        ),
      };
    }
    // テスト環境では next/link のプリフェッチを無効化する
    // （未起動バックエンドへの接続エラーログを抑制するため）
    if (process.env.APP_ENV === "test") {
      config.resolve.alias = {
        ...config.resolve.alias,
        "next/link": path.resolve(
          __dirname,
          "tests/__mocks__/next-link-no-prefetch.tsx",
        ),
      };
    }
    return config;
  },
};

export default nextConfig;
