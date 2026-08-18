import { test, expect } from "@playwright/experimental-ct-react";
import { classifyBot } from "@/app/lib/guard/bot";

const CHROME_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const HEADLESS_CHROME_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/131.0.0.0 Safari/537.36";

test.describe("classifyBot", () => {
  test("should allow me to classify Googlebot as a claimed crawler", () => {
    // Arrange
    const ua =
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

    // Act
    const result = classifyBot(ua);

    // Assert
    expect(result).toBe("claimed-crawler");
  });

  test("should allow me to classify a claimed crawler regardless of letter case", () => {
    // Arrange
    const ua = "Mozilla/5.0 (compatible; BINGBOT/2.0; +http://www.bing.com/bingbot.htm)";

    // Act
    const result = classifyBot(ua);

    // Assert
    expect(result).toBe("claimed-crawler");
  });

  test("should allow me to classify facebookexternalhit as a claimed crawler", () => {
    // Arrange
    const ua = "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";

    // Act
    const result = classifyBot(ua);

    // Assert
    expect(result).toBe("claimed-crawler");
  });

  test("should allow me to classify AhrefsBot as an seo crawler", () => {
    // Arrange
    const ua = "Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)";

    // Act
    const result = classifyBot(ua);

    // Assert
    expect(result).toBe("seo-crawler");
  });

  test("should not allow me to see an seo crawler classified as malicious", () => {
    // Arrange
    const ua = "Mozilla/5.0 (compatible; SemrushBot/7~bl; +http://www.semrush.com/bot.html)";

    // Act
    const result = classifyBot(ua);

    // Assert
    expect(result).not.toBe("malicious");
  });

  test("should allow me to classify curl as malicious", () => {
    // Arrange
    const ua = "curl/8.4.0";

    // Act
    const result = classifyBot(ua);

    // Assert
    expect(result).toBe("malicious");
  });

  test("should allow me to classify python-requests as malicious", () => {
    // Arrange
    const ua = "python-requests/2.31.0";

    // Act
    const result = classifyBot(ua);

    // Assert
    expect(result).toBe("malicious");
  });

  test("should allow me to classify sqlmap as malicious", () => {
    // Arrange
    const ua = "sqlmap/1.8#stable (https://sqlmap.org)";

    // Act
    const result = classifyBot(ua);

    // Assert
    expect(result).toBe("malicious");
  });

  test("should allow me to classify an ordinary browser as unknown", () => {
    // Arrange
    const ua = CHROME_UA;

    // Act
    const result = classifyBot(ua);

    // Assert
    expect(result).toBe("unknown");
  });

  test("should not allow me to see HeadlessChrome classified as malicious", () => {
    // Arrange
    // E2E は HeadlessChrome で動くため、悪性判定すると全 E2E が 403 で落ちる
    const ua = HEADLESS_CHROME_UA;

    // Act
    const result = classifyBot(ua);

    // Assert
    expect(result).toBe("unknown");
  });

  test("should not allow me to evade the malicious check by claiming to be a crawler", () => {
    // Arrange
    // 悪性判定をクローラーの名乗りより先に行わないと、この UA が
    // claimed-crawler になって 403 を回避できてしまう
    const ua = "curl/8.4.0 Googlebot";

    // Act
    const result = classifyBot(ua);

    // Assert
    expect(result).toBe("malicious");
  });

  test("should allow me to classify an empty user agent as unknown", () => {
    // Arrange
    const ua = "";

    // Act
    const result = classifyBot(ua);

    // Assert
    expect(result).toBe("unknown");
  });

  test("should allow me to classify a missing user agent as unknown", () => {
    // Arrange
    const ua = null;

    // Act
    const result = classifyBot(ua);

    // Assert
    expect(result).toBe("unknown");
  });
});
