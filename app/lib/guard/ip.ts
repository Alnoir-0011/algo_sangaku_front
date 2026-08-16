/** どのヘッダーからも IP を特定できなかったときに使う匿名値 */
const ANONYMOUS_IP = "0.0.0.0";

/**
 * リクエストヘッダーからクライアント IP を抽出する。
 *
 * Vercel では x-forwarded-for の先頭が信頼できるクライアント IP になる。
 * cf-connecting-ip は将来 Cloudflare を挟んだ場合に備えた先読みで、コストはない。
 *
 * これらのヘッダーは Vercel 以外の環境では詐称可能である点に注意する
 * （E2E ではこれを逆用してテストごとにカウンタを分離している）。
 */
export function getClientIp(headers: Headers): string {
  const cloudflareIp = headers.get("cf-connecting-ip");
  if (cloudflareIp) return cloudflareIp;

  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const clientIp = forwardedFor.split(",")[0].trim();
    if (clientIp) return clientIp;
  }

  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp;

  return ANONYMOUS_IP;
}
