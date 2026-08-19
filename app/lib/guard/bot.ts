export type BotClass =
  | "claimed-crawler"
  | "seo-crawler"
  | "malicious"
  | "unknown";

/**
 * 検索・SNS のクローラーを名乗る UA。
 *
 * "verified" ではなく "claimed" としているのは、逆引きや IP レンジによる
 * 検証を一切していないため。UA に Googlebot と書けば誰でもこの分類になる。
 * 「クローラーだから許す」という判断をこれ以上増やさないこと。
 */
const CLAIMED_CRAWLERS =
  /(Googlebot|bingbot|DuckDuckBot|Applebot|Slurp|YandexBot|Baiduspider|facebookexternalhit|Twitterbot|LinkedInBot)/i;

/** SEO 解析クローラー。名乗りを信じている点は上と同じ */
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
 * 悪性の判定を最初に行う。クローラーの名乗りを先に見ると
 * "curl/8.0 Googlebot" のような UA で悪性判定を回避できてしまうため。
 *
 * 判定に使うのは UA のみ。Accept-Language の欠如は誤検知が多いため、
 * 引数として受け取らないことで構造的に判定材料から外している。
 */
export function classifyBot(userAgent: string | null): BotClass {
  if (!userAgent) return "unknown";
  if (MALICIOUS_AGENTS.test(userAgent)) return "malicious";
  if (CLAIMED_CRAWLERS.test(userAgent)) return "claimed-crawler";
  if (SEO_CRAWLERS.test(userAgent)) return "seo-crawler";
  return "unknown";
}
