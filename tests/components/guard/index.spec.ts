import { test, expect } from "@playwright/experimental-ct-react";
import {
  resolveGuardMode,
  classifyRoute,
  buildRateLimitKey,
  toResetSeconds,
} from "@/app/lib/guard";

// resolveGuardMode（ガードのモードの解決）
test.describe("resolveGuardMode", () => {
  // shadow モードを有効にできる
  test("should allow me to enable shadow mode", () => {
    // Arrange
    const raw = "shadow";

    // Act
    const mode = resolveGuardMode(raw);

    // Assert
    expect(mode).toBe("shadow");
  });

  // enforce モードを有効にできる
  test("should allow me to enable enforce mode", () => {
    // Arrange
    const raw = "enforce";

    // Act
    const mode = resolveGuardMode(raw);

    // Assert
    expect(mode).toBe("enforce");
  });

  // ガードを明示的にオフにできる
  test("should allow me to turn the guard off explicitly", () => {
    // Arrange
    const raw = "off";

    // Act
    const mode = resolveGuardMode(raw);

    // Assert
    expect(mode).toBe("off");
  });

  // 変数が未設定のとき、デフォルトでオフになる
  test("should allow me to default to off when the variable is unset", () => {
    // Arrange
    const raw = undefined;

    // Act
    const mode = resolveGuardMode(raw);

    // Assert
    expect(mode).toBe("off");
  });

  // 認識できない値では、ガードを有効にできない
  test("should not allow me to enable the guard with an unrecognised value", () => {
    // Arrange
    const raw = "on";

    // Act
    const mode = resolveGuardMode(raw);

    // Assert
    expect(mode).toBe("off");
  });

  // 大文字小文字が異なる値では、ガードを有効にできない
  test("should not allow me to enable the guard with a differently cased value", () => {
    // Arrange
    const raw = "SHADOW";

    // Act
    const mode = resolveGuardMode(raw);

    // Assert
    expect(mode).toBe("off");
  });
});

// classifyRoute（リクエストのルート分類）
test.describe("classifyRoute", () => {
  // Server Action のリクエストを分類できる
  test("should allow me to classify a server action request", () => {
    // Act
    const group = classifyRoute("POST", "/sangakus/1");

    // Assert
    expect(group).toBe("server-action");
  });

  // サインインのリクエストを分類できる
  test("should allow me to classify a sign-in request", () => {
    // Act
    const group = classifyRoute("POST", "/api/auth/sign-in/social");

    // Assert
    expect(group).toBe("signin");
  });

  // 認証のプレフィックス配下のコールバックを、サインインのリクエストに分類できる
  test("should allow me to classify a callback under the auth prefix as a sign-in request", () => {
    // Act
    const group = classifyRoute("POST", "/api/auth/callback/google");

    // Assert
    expect(group).toBe("signin");
  });

  // ページのリクエストを、公開 GET に分類できる
  test("should allow me to classify a page request as a public get", () => {
    // Act
    const group = classifyRoute("GET", "/shrines");

    // Assert
    expect(group).toBe("public-get");
  });

  // サインインの GET が、サインインの試行として数えられない
  test("should not allow me to see a sign-in get counted as a sign-in attempt", () => {
    // Act
    const group = classifyRoute("GET", "/api/auth/get-session");

    // Assert
    expect(group).toBe("public-get");
  });

  // HEAD リクエストでのページ取得を、公開 GET に分類できる
  test("should allow me to fetch a page with a head request as a public get", () => {
    // Act
    const group = classifyRoute("HEAD", "/shrines");

    // Assert
    expect(group).toBe("public-get");
  });

  // 変わったメソッドでレート制限を逃れられない
  test("should not allow me to escape the rate limit with an unusual method", () => {
    // Arrange
    // PUT でもページはフルレンダリングされるため、数えなければ回避経路になる

    // Act
    const group = classifyRoute("PUT", "/sangakus/1");

    // Assert
    expect(group).toBe("server-action");
  });

  // body ベースの Server Action でレート制限を逃れられない
  test("should not allow me to escape the rate limit with a body based server action", () => {
    // Arrange
    // Server Action は next-action ヘッダーがなくてもボディの $ACTION_ID_* で起動できる

    // Act
    const group = classifyRoute("POST", "/sangakus/create");

    // Assert
    expect(group).toBe("server-action");
  });

  // サインインのコールバックのパスは、パス判定が先に行われて signin に分類される
  test("should not allow me to relax the sign-in limit by adding a next-action header", () => {
    // Arrange
    // next-action はクライアントが自由に付けられる。パス判定を先に行わないと
    // signin（10/分）が server-action（20/分）へ格上げされてしまう

    // Act
    const group = classifyRoute("POST", "/api/auth/callback/google");

    // Assert
    expect(group).toBe("signin");
  });
});

// buildRateLimitKey（レート制限キーの組み立て）
test.describe("buildRateLimitKey", () => {
  // サインイン済みの Server Action を、ハッシュ化したメールアドレスでキー化できる
  test("should allow me to key a signed-in server action by the hashed email", async () => {
    // Arrange
    const email = "user@example.com";

    // Act
    const key = await buildRateLimitKey("server-action", {
      ip: "198.51.100.20",
      email,
    });

    // Assert
    expect(key).toMatch(/^guard:server-action:user:[0-9a-f]{32}$/);
  });

  // 匿名の Server Action を、IP でキー化できる
  test("should allow me to key an anonymous server action by ip", async () => {
    // Arrange
    const ip = "198.51.100.20";

    // Act
    const key = await buildRateLimitKey("server-action", { ip, email: null });

    // Assert
    expect(key).toBe("guard:server-action:ip:198.51.100.20");
  });

  // サインインの試行を、IP でキー化できる
  test("should allow me to key a sign-in attempt by ip", async () => {
    // Arrange
    const ip = "198.51.100.20";

    // Act
    const key = await buildRateLimitKey("signin", { ip, email: null });

    // Assert
    expect(key).toBe("guard:signin:ip:198.51.100.20");
  });

  // 公開 GET を、IP でキー化できる
  test("should allow me to key a public get by ip", async () => {
    // Arrange
    const ip = "198.51.100.20";

    // Act
    const key = await buildRateLimitKey("public-get", { ip, email: null });

    // Assert
    expect(key).toBe("guard:public-get:ip:198.51.100.20");
  });

  // 同じメールアドレスでは、同じキーが得られる
  test("should allow me to get the same key for the same email", async () => {
    // Arrange
    const email = "user@example.com";

    // Act
    const first = await buildRateLimitKey("server-action", {
      ip: "198.51.100.20",
      email,
    });
    const second = await buildRateLimitKey("server-action", {
      ip: "203.0.113.10",
      email,
    });

    // Assert
    expect(first).toBe(second);
  });

  // 異なるメールアドレスでは、同じキーが得られない
  test("should not allow me to get the same key for different emails", async () => {
    // Arrange
    const ip = "198.51.100.20";

    // Act
    const first = await buildRateLimitKey("server-action", {
      ip,
      email: "one@example.com",
    });
    const second = await buildRateLimitKey("server-action", {
      ip,
      email: "two@example.com",
    });

    // Assert
    expect(first).not.toBe(second);
  });

  // キーの中に平文のメールアドレスが見えない
  test("should not allow me to see the plain email inside the key", async () => {
    // Arrange
    const email = "user@example.com";

    // Act
    const key = await buildRateLimitKey("server-action", {
      ip: "198.51.100.20",
      email,
    });

    // Assert
    expect(key).not.toContain(email);
  });
});

// toResetSeconds（リセット時刻から残り秒数への変換）
test.describe("toResetSeconds", () => {
  // リセット時刻を、残り秒数に変換できる
  test("should allow me to convert a reset timestamp into remaining seconds", () => {
    // Arrange
    const now = 1_700_000_000_000;
    const reset = now + 30_000;

    // Act
    const seconds = toResetSeconds(reset, now);

    // Assert
    expect(seconds).toBe(30);
  });

  // 残り秒数を切り捨てられる
  test("should allow me to round the remaining seconds down", () => {
    // Arrange
    const now = 1_700_000_000_000;
    const reset = now + 30_900;

    // Act
    const seconds = toResetSeconds(reset, now);

    // Assert
    expect(seconds).toBe(30);
  });

  // 残り秒数が 1 秒未満にならない
  test("should not allow me to get a remaining value below one second", () => {
    // Arrange
    const now = 1_700_000_000_000;
    const reset = now - 5_000;

    // Act
    const seconds = toResetSeconds(reset, now);

    // Assert
    expect(seconds).toBe(1);
  });
});
