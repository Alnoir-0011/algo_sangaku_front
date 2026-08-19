import { test, expect } from "@/tests/e2e/fixtures";
import type { TestInfo } from "@playwright/test";
import { GUARD_TEST_LIMIT } from "./test-limit";

/**
 * 通常の E2E サーバー（ポート 4020）は GUARD_MODE=shadow で動く。
 * shadow は遮断せず観測ヘッダーだけを返すため、既存のテストには影響しない。
 *
 * x-guard-* は GUARD_DEBUG_TOKEN と一致する x-guard-debug ヘッダーを
 * 付けたときだけ返る。誰にでも返すと、遮断されるリスクなしに回避手法を
 * 総当たりされてしまうため。
 *
 * テストごとに x-forwarded-for で固有の IP を名乗る。そうしないと他の
 * E2E と同じカウンタ（localhost）を共有してしまい、しきい値を超えて落ちる。
 * ブラウザごとの project は同じサーバーを共有するため、project ごとに
 * 別の /24 を割り当てて分離する。
 */
const DEBUG_TOKEN = "e2e-guard-debug";

const PROJECT_OCTET: Record<string, number> = {
  chromium: 1,
  firefox: 2,
  webkit: 3,
};

function debugHeaders(testInfo: TestInfo, id: number): Record<string, string> {
  return {
    "x-guard-debug": DEBUG_TOKEN,
    "x-forwarded-for": `198.51.${PROJECT_OCTET[testInfo.project.name] ?? 9}.${id}`,
  };
}

test.describe("Middleware guard (shadow)", () => {
  test("should allow me to see the guard verdict when I present the debug token", async ({
    request,
  }, testInfo) => {
    const response = await request.get("/", {
      headers: debugHeaders(testInfo, 10),
    });

    expect({
      mode: response.headers()["x-guard-mode"],
      decision: response.headers()["x-guard-decision"],
      reason: response.headers()["x-guard-reason"],
    }).toEqual({ mode: "shadow", decision: "allow", reason: "ok" });
  });

  test("should not allow me to see the guard verdict without the debug token", async ({
    request,
  }, testInfo) => {
    const response = await request.get("/", {
      headers: { "x-forwarded-for": `198.51.${PROJECT_OCTET[testInfo.project.name] ?? 9}.20` },
    });

    expect({
      mode: response.headers()["x-guard-mode"],
      reason: response.headers()["x-guard-reason"],
      remaining: response.headers()["x-guard-remaining"],
    }).toEqual({ mode: undefined, reason: undefined, remaining: undefined });
  });

  test("should allow me to see my remaining budget for public pages", async ({
    request,
  }, testInfo) => {
    const response = await request.get("/shrines", {
      headers: debugHeaders(testInfo, 11),
    });

    expect(Number(response.headers()["x-guard-remaining"])).toBe(
      GUARD_TEST_LIMIT - 1,
    );
  });

  test("should allow me to keep browsing with a malicious user agent while only observing", async ({
    request,
  }, testInfo) => {
    const response = await request.get("/", {
      headers: { ...debugHeaders(testInfo, 13), "user-agent": "curl/8.4.0" },
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
    const headers = debugHeaders(testInfo, 14);

    const responses = await Promise.all(
      Array.from({ length: GUARD_TEST_LIMIT + 5 }, () =>
        request.get("/", { headers }),
      ),
    );
    const blocked = responses.filter((response) => response.status() !== 200);

    expect(blocked).toHaveLength(0);
  });
});
