import { ipAddress } from "@vercel/functions";

/** どのヘッダーからも IP を特定できなかったときに使う匿名値 */
const ANONYMOUS_IP = "0.0.0.0";

/** IPv6 の最大長（45 文字）。Redis のキー長を攻撃者に制御させないための上限 */
const MAX_IP_LENGTH = 45;

const IPV4 = /^(\d{1,3}\.){3}\d{1,3}$/;
const IPV6 = /^[0-9a-f:.]+$/i;

/**
 * レート制限のキーに埋め込んで安全な形かを検証する。
 *
 * 厳密な IP の妥当性検証ではなく、キーインジェクション・ログ偽装・
 * 長大なキーによる Redis 圧迫を防ぐことが目的。
 */
function isIpLiteral(value: string): boolean {
  if (value.length === 0 || value.length > MAX_IP_LENGTH) return false;
  return IPV4.test(value) || IPV6.test(value);
}

/**
 * リクエストヘッダーからクライアント IP を抽出する。
 *
 * Next.js 15 で NextRequest.ip は削除されており、公式の代替は
 * @vercel/functions の ipAddress()。これは Vercel が付与する x-real-ip
 * だけを読む。Vercel は受信時にクライアント由来の同名ヘッダーを取り除くため、
 * 本番ではこの経路だけが使われ、詐称できない。
 *
 * x-forwarded-for は Vercel 以外（ローカルの next start・E2E）向けの
 * フォールバック。x-real-ip が付かない環境で全員が同じカウンタを共有して
 * サイト全体が 1 バケットに落ちるのを避けるために残している。
 * この経路は詐称可能なので、Vercel 以外へデプロイする場合は必ず見直すこと。
 *
 * cf-connecting-ip は読まない。Cloudflare を経由していない構成では
 * このヘッダーを取り除く主体が経路上に存在せず、クライアントが名乗った値を
 * そのまま信頼することになり、レート制限を無制限に回避できてしまう
 * （他人の IP を騙って被害者を締め出すことも可能になる）。
 */
export function getClientIp(headers: Headers): string {
  const candidates = [
    ipAddress(headers),
    headers.get("x-forwarded-for")?.split(",")[0].trim(),
  ];

  for (const candidate of candidates) {
    if (candidate && isIpLiteral(candidate)) return candidate;
  }

  return ANONYMOUS_IP;
}
