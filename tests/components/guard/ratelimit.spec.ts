import { test, expect } from "@playwright/experimental-ct-react";
import {
  createMemoryLimiter,
  createLimiter,
  checkLimit,
  withMemoryFallback,
  type Limiter,
} from "@/app/lib/guard/ratelimit";

const NOW = 1_700_000_000_000;
const WINDOW_MS = 60_000;

test.describe("createMemoryLimiter", () => {
  test("should allow me to pass a request that is within the threshold", async () => {
    // Arrange
    const limiter = createMemoryLimiter({ limit: 3, windowMs: WINDOW_MS });

    // Act
    const result = await limiter.limit("guard:public-get:ip:198.51.100.20", NOW);

    // Assert
    expect(result.success).toBe(true);
  });

  test("should allow me to see the remaining count decrease on each request", async () => {
    // Arrange
    const limiter = createMemoryLimiter({ limit: 3, windowMs: WINDOW_MS });
    const key = "guard:public-get:ip:198.51.100.20";

    // Act
    const first = await limiter.limit(key, NOW);
    const second = await limiter.limit(key, NOW);

    // Assert
    expect([first.remaining, second.remaining]).toEqual([2, 1]);
  });

  test("should not allow me to exceed the threshold within the window", async () => {
    // Arrange
    const limiter = createMemoryLimiter({ limit: 2, windowMs: WINDOW_MS });
    const key = "guard:signin:ip:198.51.100.20";
    await limiter.limit(key, NOW);
    await limiter.limit(key, NOW);

    // Act
    const result = await limiter.limit(key, NOW);

    // Assert
    expect(result.success).toBe(false);
  });

  test("should allow me to send a request again once the window has passed", async () => {
    // Arrange
    const limiter = createMemoryLimiter({ limit: 1, windowMs: WINDOW_MS });
    const key = "guard:signin:ip:198.51.100.20";
    await limiter.limit(key, NOW);

    // Act
    const blocked = await limiter.limit(key, NOW + WINDOW_MS - 1);
    const recovered = await limiter.limit(key, NOW + WINDOW_MS + 1);

    // Assert
    expect([blocked.success, recovered.success]).toEqual([false, true]);
  });

  test("should allow me to keep the counters of different keys independent", async () => {
    // Arrange
    const limiter = createMemoryLimiter({ limit: 1, windowMs: WINDOW_MS });
    await limiter.limit("guard:public-get:ip:198.51.100.20", NOW);

    // Act
    const other = await limiter.limit("guard:public-get:ip:203.0.113.10", NOW);

    // Assert
    expect(other.success).toBe(true);
  });

  test("should allow me to read the configured limit and the reset timestamp", async () => {
    // Arrange
    const limiter = createMemoryLimiter({ limit: 20, windowMs: WINDOW_MS });

    // Act
    const result = await limiter.limit("guard:server-action:ip:198.51.100.20", NOW);

    // Assert
    expect({ limit: result.limit, reset: result.reset }).toEqual({
      limit: 20,
      reset: NOW + WINDOW_MS,
    });
  });
});

test.describe("createLimiter", () => {
  test("should allow me to fall back to the in-memory limiter when upstash is not configured", async () => {
    // Arrange
    const limiter = createLimiter({
      url: undefined,
      token: undefined,
      limit: 1,
      windowMs: WINDOW_MS,
    });
    const key = "guard:public-get:ip:198.51.100.20";

    // Act
    const first = await limiter.limit(key, NOW);
    const second = await limiter.limit(key, NOW);

    // Assert
    expect([first.success, second.success]).toEqual([true, false]);
  });
});

test.describe("withMemoryFallback", () => {
  test("should allow me to use the primary store while it is healthy", async () => {
    // Arrange
    const primary = createMemoryLimiter({ limit: 5, windowMs: WINDOW_MS });
    const limiter = withMemoryFallback(primary, { limit: 1, windowMs: WINDOW_MS });

    // Act
    const result = await limiter.limit("guard:signin:ip:198.51.100.20", NOW);

    // Assert
    expect({ limit: result.limit, remaining: result.remaining }).toEqual({
      limit: 5,
      remaining: 4,
    });
  });

  test("should not allow me to escape the rate limit when the store is exhausted", async () => {
    // Arrange
    // Upstash の無料枠を使い切ると以降は全部エラーになる。素通しにすると
    // 月末にレート制限が消えてしまうため、粗くても数え続ける
    const exhausted: Limiter = {
      limit: () => Promise.reject(new Error("max monthly commands exceeded")),
    };
    const limiter = withMemoryFallback(exhausted, {
      limit: 1,
      windowMs: WINDOW_MS,
    });
    const key = "guard:server-action:ip:198.51.100.20";

    // Act
    const first = await limiter.limit(key, NOW);
    const second = await limiter.limit(key, NOW);

    // Assert
    expect([first.success, second.success]).toEqual([true, false]);
  });

  test("should allow me to see that the counter degraded to the in-memory store", async () => {
    // Arrange
    const broken: Limiter = {
      limit: () => Promise.reject(new Error("unreachable")),
    };
    const limiter = withMemoryFallback(broken, { limit: 5, windowMs: WINDOW_MS });

    // Act
    const result = await limiter.limit("guard:signin:ip:198.51.100.20", NOW);

    // Assert
    // 「制限がかかっていない」ではなく「精度が落ちている」ことを区別できる
    expect({ success: result.success, degraded: result.degraded }).toEqual({
      success: true,
      degraded: true,
    });
  });

  test("should allow me to go back to the primary store once it recovers", async () => {
    // Arrange
    let failing = true;
    const flaky: Limiter = {
      limit: (key, now) => {
        if (failing) return Promise.reject(new Error("temporarily down"));
        return Promise.resolve({
          success: true,
          limit: 99,
          remaining: 98,
          reset: (now ?? NOW) + WINDOW_MS,
        });
      },
    };
    const limiter = withMemoryFallback(flaky, { limit: 1, windowMs: WINDOW_MS });
    const key = "guard:server-action:ip:198.51.100.20";
    await limiter.limit(key, NOW);

    // Act
    failing = false;
    const recovered = await limiter.limit(key, NOW);

    // Assert
    expect({ limit: recovered.limit, degraded: recovered.degraded }).toEqual({
      limit: 99,
      degraded: undefined,
    });
  });

  test("should allow me to keep the fallback counters separate per key", async () => {
    // Arrange
    const broken: Limiter = {
      limit: () => Promise.reject(new Error("unreachable")),
    };
    const limiter = withMemoryFallback(broken, { limit: 1, windowMs: WINDOW_MS });
    await limiter.limit("guard:server-action:ip:198.51.100.20", NOW);

    // Act
    const other = await limiter.limit("guard:server-action:ip:203.0.113.10", NOW);

    // Assert
    expect(other.success).toBe(true);
  });
});

test.describe("createMemoryLimiter の追い出し", () => {
  test("should not allow me to reset an active counter by flooding new keys", async () => {
    // Arrange
    // Map#set は既存キーの挿入位置を変えないため、delete してから set し直さないと
    // 「最初に観測したキー」から追い出される。アクセスされ続けているキーほど
    // 古い位置に残るので、連打中の相手が真っ先にリセットされてしまう。
    //
    // なお、これを直しても「自分のキーを触らずに大量の新規キーを流し込んで
    // 自分を追い出す」攻撃は防げない。有限のメモリで数える以上は避けられず、
    // public-get を「無制限よりまし」の層と位置づけている理由でもある。
    const limit = 100;
    const limiter = createMemoryLimiter({ limit, windowMs: WINDOW_MS });
    const activeKey = "guard:public-get:ip:198.51.100.20";
    let touches = 0;

    // Act
    // 上限（10,000）を超える新規キーを送り込みつつ、対象キーも触り続ける
    for (let i = 0; i < 10_050; i += 1) {
      await limiter.limit(`guard:public-get:ip:10.0.${i >> 8}.${i & 255}`, NOW);
      if (i % 2000 === 0) {
        await limiter.limit(activeKey, NOW);
        touches += 1;
      }
    }
    const result = await limiter.limit(activeKey, NOW);
    touches += 1;

    // Assert
    // 追い出されていなければ、それまでのアクセス回数がそのまま残っている
    expect(result.remaining).toBe(limit - touches);
  });
});

test.describe("checkLimit", () => {
  test("should allow me to keep serving requests when the store throws", async () => {
    // Arrange
    const brokenLimiter = {
      limit: () => Promise.reject(new Error("upstash unreachable")),
    };

    // Act
    const result = await checkLimit(brokenLimiter, "guard:signin:ip:198.51.100.20", NOW);

    // Assert
    expect({ success: result.success, unavailable: result.unavailable }).toEqual({
      success: true,
      unavailable: true,
    });
  });

  test("should allow me to get the store result when the store is healthy", async () => {
    // Arrange
    const limiter = createMemoryLimiter({ limit: 1, windowMs: WINDOW_MS });
    const key = "guard:signin:ip:198.51.100.20";
    await checkLimit(limiter, key, NOW);

    // Act
    const result = await checkLimit(limiter, key, NOW);

    // Assert
    expect({ success: result.success, unavailable: result.unavailable }).toEqual({
      success: false,
      unavailable: false,
    });
  });
});
