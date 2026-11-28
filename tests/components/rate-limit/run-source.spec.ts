import { test, expect } from "@playwright/experimental-ct-react";
import { checkRunSourceRateLimit } from "@/app/lib/rate-limit/run-source";

// checkRunSourceRateLimit（コード実行のレート制限）
test.describe("checkRunSourceRateLimit", () => {
  // 1 分以内に 5 回まで呼び出せる
  test("should allow me to call it up to 5 times within a minute", async () => {
    // Arrange
    const email = "run-source-within-limit@example.com";

    // Act
    const results = [];
    for (let i = 0; i < 5; i += 1) {
      results.push(await checkRunSourceRateLimit(email));
    }

    // Assert
    expect(results).toEqual([true, true, true, true, true]);
  });

  // 同じ 1 分以内に 6 回目は呼び出せない
  test("should not allow me to call it a 6th time within the same minute", async () => {
    // Arrange
    const email = "run-source-exceeded@example.com";
    for (let i = 0; i < 5; i += 1) {
      await checkRunSourceRateLimit(email);
    }

    // Act
    const result = await checkRunSourceRateLimit(email);

    // Assert
    expect(result).toBe(false);
  });

  // ユーザーごとのカウンターを、独立に保てる
  test("should keep different users' counters independent", async () => {
    // Arrange
    const exhaustedEmail = "run-source-user-a@example.com";
    const otherEmail = "run-source-user-b@example.com";
    for (let i = 0; i < 5; i += 1) {
      await checkRunSourceRateLimit(exhaustedEmail);
    }

    // Act
    const exhausted = await checkRunSourceRateLimit(exhaustedEmail);
    const other = await checkRunSourceRateLimit(otherEmail);

    // Assert
    expect([exhausted, other]).toEqual([false, true]);
  });
});
