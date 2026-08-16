import { test, expect } from "@playwright/experimental-ct-react";
import {
  resolveGuardMode,
  classifyRoute,
  buildRateLimitKey,
  toResetSeconds,
} from "@/app/lib/guard";

test.describe("resolveGuardMode", () => {
  test("should allow me to enable shadow mode", () => {
    // Arrange
    const raw = "shadow";

    // Act
    const mode = resolveGuardMode(raw);

    // Assert
    expect(mode).toBe("shadow");
  });

  test("should allow me to enable enforce mode", () => {
    // Arrange
    const raw = "enforce";

    // Act
    const mode = resolveGuardMode(raw);

    // Assert
    expect(mode).toBe("enforce");
  });

  test("should allow me to turn the guard off explicitly", () => {
    // Arrange
    const raw = "off";

    // Act
    const mode = resolveGuardMode(raw);

    // Assert
    expect(mode).toBe("off");
  });

  test("should allow me to default to off when the variable is unset", () => {
    // Arrange
    const raw = undefined;

    // Act
    const mode = resolveGuardMode(raw);

    // Assert
    expect(mode).toBe("off");
  });

  test("should not allow me to enable the guard with an unrecognised value", () => {
    // Arrange
    const raw = "on";

    // Act
    const mode = resolveGuardMode(raw);

    // Assert
    expect(mode).toBe("off");
  });

  test("should not allow me to enable the guard with a differently cased value", () => {
    // Arrange
    const raw = "SHADOW";

    // Act
    const mode = resolveGuardMode(raw);

    // Assert
    expect(mode).toBe("off");
  });
});

test.describe("classifyRoute", () => {
  test("should allow me to classify a server action request", () => {
    // Arrange
    const headers = new Headers({ "next-action": "7f9a0c1b2d" });

    // Act
    const group = classifyRoute("POST", "/sangakus/1", headers);

    // Assert
    expect(group).toBe("server-action");
  });

  test("should allow me to classify a sign-in request", () => {
    // Arrange
    const headers = new Headers();

    // Act
    const group = classifyRoute("POST", "/api/auth/signin", headers);

    // Assert
    expect(group).toBe("signin");
  });

  test("should allow me to classify a callback under the auth prefix as a sign-in request", () => {
    // Arrange
    const headers = new Headers();

    // Act
    const group = classifyRoute("POST", "/api/auth/callback/google", headers);

    // Assert
    expect(group).toBe("signin");
  });

  test("should allow me to classify a page request as a public get", () => {
    // Arrange
    const headers = new Headers();

    // Act
    const group = classifyRoute("GET", "/shrines", headers);

    // Assert
    expect(group).toBe("public-get");
  });

  test("should not allow me to see a plain post counted as a server action", () => {
    // Arrange
    const headers = new Headers();

    // Act
    const group = classifyRoute("POST", "/sangakus/1", headers);

    // Assert
    expect(group).toBe("other");
  });

  test("should not allow me to see a sign-in get counted as a sign-in attempt", () => {
    // Arrange
    const headers = new Headers();

    // Act
    const group = classifyRoute("GET", "/api/auth/session", headers);

    // Assert
    expect(group).toBe("public-get");
  });

  test("should allow me to classify an unsupported method as other", () => {
    // Arrange
    const headers = new Headers();

    // Act
    const group = classifyRoute("DELETE", "/sangakus/1", headers);

    // Assert
    expect(group).toBe("other");
  });
});

test.describe("buildRateLimitKey", () => {
  test("should allow me to key a signed-in server action by the hashed email", async () => {
    // Arrange
    const email = "user@example.com";

    // Act
    const key = await buildRateLimitKey("server-action", {
      ip: "198.51.100.20",
      email,
    });

    // Assert
    expect(key).toMatch(/^guard:server-action:user:[0-9a-f]{16}$/);
  });

  test("should allow me to key an anonymous server action by ip", async () => {
    // Arrange
    const ip = "198.51.100.20";

    // Act
    const key = await buildRateLimitKey("server-action", { ip, email: null });

    // Assert
    expect(key).toBe("guard:server-action:ip:198.51.100.20");
  });

  test("should allow me to key a sign-in attempt by ip", async () => {
    // Arrange
    const ip = "198.51.100.20";

    // Act
    const key = await buildRateLimitKey("signin", { ip, email: null });

    // Assert
    expect(key).toBe("guard:signin:ip:198.51.100.20");
  });

  test("should allow me to key a public get by ip", async () => {
    // Arrange
    const ip = "198.51.100.20";

    // Act
    const key = await buildRateLimitKey("public-get", { ip, email: null });

    // Assert
    expect(key).toBe("guard:public-get:ip:198.51.100.20");
  });

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

test.describe("toResetSeconds", () => {
  test("should allow me to convert a reset timestamp into remaining seconds", () => {
    // Arrange
    const now = 1_700_000_000_000;
    const reset = now + 30_000;

    // Act
    const seconds = toResetSeconds(reset, now);

    // Assert
    expect(seconds).toBe(30);
  });

  test("should allow me to round the remaining seconds down", () => {
    // Arrange
    const now = 1_700_000_000_000;
    const reset = now + 30_900;

    // Act
    const seconds = toResetSeconds(reset, now);

    // Assert
    expect(seconds).toBe(30);
  });

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
