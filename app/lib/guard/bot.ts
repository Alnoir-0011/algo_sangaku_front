export type BotClass =
  | "verified-crawler"
  | "seo-crawler"
  | "malicious"
  | "unknown";

/** 検索・SNS の正規クローラー。公開 GET のみ許可する */
const VERIFIED_CRAWLERS =
  /(Googlebot|bingbot|DuckDuckBot|Applebot|Slurp|YandexBot|Baiduspider|facebookexternalhit|Twitterbot|LinkedInBot)/i;

/** SEO 解析クローラー。正規クローラーと同じく公開 GET のみ許可する */
const SEO_CRAWLERS = /(AhrefsBot|SemrushBot|MJ12bot|DotBot)/i;

/**
 * 既知の悪性・自動化ツール。
 *
 * HeadlessChrome は意図的に含めない。E2E が HeadlessChrome で動くため、
 * 含めるとテストが全滅する。
 * crawler / spider のような広いパターンも使わない。正規クローラーを巻き込む。
 */
const MALICIOUS_AGENTS =
  /(curl|wget|python-requests|scrapy|go-http-client|java\/|libwww-perl|sqlmap|nikto|masscan|nmap)/i;

/**
 * User-Agent から Bot の種別を判定する。
 *
 * 判定に使うのは UA のみ。Accept-Language の欠如は誤検知が多いため、
 * 引数として受け取らないことで構造的に判定材料から外している。
 */
export function classifyBot(userAgent: string | null): BotClass {
  if (!userAgent) return "unknown";
  if (VERIFIED_CRAWLERS.test(userAgent)) return "verified-crawler";
  if (SEO_CRAWLERS.test(userAgent)) return "seo-crawler";
  if (MALICIOUS_AGENTS.test(userAgent)) return "malicious";
  return "unknown";
}
