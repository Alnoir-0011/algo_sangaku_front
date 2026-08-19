import { test, expect } from "@playwright/experimental-ct-react";
import { getClientIp } from "@/app/lib/guard/ip";

test.describe("getClientIp", () => {
  test("should allow me to read the client ip from the header Vercel sets", () => {
    // Arrange
    // @vercel/functions の ipAddress() が読むのは x-real-ip だけ
    const headers = new Headers({ "x-real-ip": "203.0.113.10" });

    // Act
    const ip = getClientIp(headers);

    // Assert
    expect(ip).toBe("203.0.113.10");
  });

  test("should allow me to prefer the header Vercel controls over the client supplied one", () => {
    // Arrange
    const headers = new Headers({
      "x-real-ip": "203.0.113.10",
      "x-forwarded-for": "198.51.100.20",
    });

    // Act
    const ip = getClientIp(headers);

    // Assert
    expect(ip).toBe("203.0.113.10");
  });

  test("should not allow me to override the client ip with cf-connecting-ip", () => {
    // Arrange
    // Cloudflare を経由しない構成では、このヘッダーは攻撃者が自由に名乗れる。
    // 採用するとレート制限を無制限に回避できるため読んではならない
    const headers = new Headers({
      "cf-connecting-ip": "9.9.9.9",
      "x-forwarded-for": "198.51.100.20",
    });

    // Act
    const ip = getClientIp(headers);

    // Assert
    expect(ip).toBe("198.51.100.20");
  });

  test("should not allow me to be identified only by cf-connecting-ip", () => {
    // Arrange
    const headers = new Headers({ "cf-connecting-ip": "9.9.9.9" });

    // Act
    const ip = getClientIp(headers);

    // Assert
    expect(ip).toBe("0.0.0.0");
  });

  test("should allow me to take the first entry of x-forwarded-for", () => {
    // Arrange
    const headers = new Headers({
      "x-forwarded-for": "198.51.100.20, 203.0.113.10, 192.0.2.30",
    });

    // Act
    const ip = getClientIp(headers);

    // Assert
    expect(ip).toBe("198.51.100.20");
  });

  test("should allow me to trim surrounding whitespace from x-forwarded-for", () => {
    // Arrange
    const headers = new Headers({
      "x-forwarded-for": "   198.51.100.20   ,203.0.113.10",
    });

    // Act
    const ip = getClientIp(headers);

    // Assert
    expect(ip).toBe("198.51.100.20");
  });

  test("should allow me to fall back to x-forwarded-for outside Vercel", () => {
    // Arrange
    // ローカルの next start は x-real-ip を付けない。ここで諦めると
    // 全員が同じカウンタを共有し、サイト全体が 1 バケットに落ちてしまう
    const headers = new Headers({ "x-forwarded-for": "192.0.2.30" });

    // Act
    const ip = getClientIp(headers);

    // Assert
    expect(ip).toBe("192.0.2.30");
  });

  test("should allow me to skip an empty header value and keep falling back", () => {
    // Arrange
    const headers = new Headers({
      "x-real-ip": "",
      "x-forwarded-for": "192.0.2.30",
    });

    // Act
    const ip = getClientIp(headers);

    // Assert
    expect(ip).toBe("192.0.2.30");
  });

  test("should allow me to get the anonymous placeholder when no ip header is present", () => {
    // Arrange
    const headers = new Headers();

    // Act
    const ip = getClientIp(headers);

    // Assert
    expect(ip).toBe("0.0.0.0");
  });

  test("should not allow me to inject an oversized value into the rate limit key", () => {
    // Arrange
    const headers = new Headers({ "x-forwarded-for": "1".repeat(2000) });

    // Act
    const ip = getClientIp(headers);

    // Assert
    expect(ip).toBe("0.0.0.0");
  });

  test("should not allow me to put arbitrary text into the rate limit key", () => {
    // Arrange
    const headers = new Headers({ "x-forwarded-for": "not-an-ip" });

    // Act
    const ip = getClientIp(headers);

    // Assert
    expect(ip).toBe("0.0.0.0");
  });

  test("should not allow me to forge a log line through the ip header", () => {
    // Arrange
    const headers = new Headers({ "x-forwarded-for": "1.2.3.4 fake log entry" });

    // Act
    const ip = getClientIp(headers);

    // Assert
    expect(ip).toBe("0.0.0.0");
  });

  test("should allow me to be identified by an ipv6 address", () => {
    // Arrange
    const headers = new Headers({ "x-forwarded-for": "2001:db8::1" });

    // Act
    const ip = getClientIp(headers);

    // Assert
    expect(ip).toBe("2001:db8::1");
  });
});
