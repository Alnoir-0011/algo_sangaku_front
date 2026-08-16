import { test, expect } from "@playwright/experimental-ct-react";
import { getClientIp } from "@/app/lib/guard/ip";

test.describe("getClientIp", () => {
  test("should allow me to read the client ip from cf-connecting-ip", () => {
    // Arrange
    const headers = new Headers({ "cf-connecting-ip": "203.0.113.10" });

    // Act
    const ip = getClientIp(headers);

    // Assert
    expect(ip).toBe("203.0.113.10");
  });

  test("should allow me to prefer cf-connecting-ip over the other headers", () => {
    // Arrange
    const headers = new Headers({
      "cf-connecting-ip": "203.0.113.10",
      "x-forwarded-for": "198.51.100.20",
      "x-real-ip": "192.0.2.30",
    });

    // Act
    const ip = getClientIp(headers);

    // Assert
    expect(ip).toBe("203.0.113.10");
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

  test("should allow me to fall back to x-real-ip when the preceding headers are absent", () => {
    // Arrange
    const headers = new Headers({ "x-real-ip": "192.0.2.30" });

    // Act
    const ip = getClientIp(headers);

    // Assert
    expect(ip).toBe("192.0.2.30");
  });

  test("should allow me to skip an empty header value and keep falling back", () => {
    // Arrange
    const headers = new Headers({
      "cf-connecting-ip": "",
      "x-forwarded-for": "",
      "x-real-ip": "192.0.2.30",
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
});
