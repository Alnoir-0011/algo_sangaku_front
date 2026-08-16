import { test, expect } from "@/tests/e2e/fixtures";
import type { TestInfo } from "@playwright/test";

/**
 * ブラウザごとの project は同じサーバー（ポート 4020）を共有するため、
 * IP を固定するとカウンタがプロジェクト間で混ざる。project ごとに
 * 別の /24 を割り当てて分離する。
 */
const PROJECT_OCTET: Record<string, number> = {
  chromium: 1,
  firefox: 2,
  webkit: 3,
};

function clientIp(testInfo: TestInfo, id: number): string {
  return `198.51.${PROJECT_OCTET[testInfo.project.name] ?? 9}.${id}`;
}

/**
 * 通常の E2E サーバー（ポート 4020）は GUARD_MODE=shadow で動く。
 * shadow は遮断せず観測ヘッダーだけを返すため、既存のテストには影響しない。
 *
 * テストごとに x-forwarded-for で固有の IP を名乗る。そうしないと他の
 * E2E と同じカウンタ（localhost）を共有してしまい、しきい値を超えて落ちる。
 *
 * prefetch を除外する挙動はここでは検証できない。Next.js が外部から注入された
 * Next-Router-Prefetch ヘッダーを middleware に渡す前に除去するため
 * （middleware に届くのは accept / host / user-agent / x-forwarded-* のみ）。
 * この分岐は tests/components/guard/runGuard.spec.ts で担保している。
 */
test.describe("Middleware guard (shadow)", () => {
  test("should allow me to see the guard verdict in the response headers", async ({
    request,
  }, testInfo) => {
    const response = await request.get("/", {
      headers: { "x-forwarded-for": clientIp(testInfo, 10) },
    });

    expect({
      mode: response.headers()["x-guard-mode"],
      decision: response.headers()["x-guard-decision"],
      reason: response.headers()["x-guard-reason"],
    }).toEqual({ mode: "shadow", decision: "allow", reason: "ok" });
  });

  test("should allow me to see my remaining budget for public pages", async ({
    request,
  }, testInfo) => {
    const response = await request.get("/shrines", {
      headers: { "x-forwarded-for": clientIp(testInfo, 11) },
    });

    expect(Number(response.headers()["x-guard-remaining"])).toBe(59);
  });

  test("should allow me to keep browsing with a malicious user agent while only observing", async ({
    request,
  }, testInfo) => {
    const response = await request.get("/", {
      headers: {
        "user-agent": "curl/8.4.0",
        "x-forwarded-for": clientIp(testInfo, 13),
      },
    });

    expect({
      status: response.status(),
      decision: response.headers()["x-guard-decision"],
      reason: response.headers()["x-guard-reason"],
    }).toEqual({ status: 200, decision: "would-block", reason: "bot-ua" });
  });

  test("should not allow me to see the guard block a request in shadow mode", async ({
    request,
  }, testInfo) => {
    const headers = { "x-forwarded-for": clientIp(testInfo, 14) };

    const responses = await Promise.all(
      Array.from({ length: 65 }, () => request.get("/", { headers })),
    );
    const blocked = responses.filter((response) => response.status() !== 200);

    expect(blocked).toHaveLength(0);
  });
});
