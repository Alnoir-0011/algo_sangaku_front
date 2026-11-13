// updateAge で再発行を絞る方法は、JWT では無視されるため使えない（nextauthjs/next-auth#13248）。
//
// 値が空の Set-Cookie は削除の指示なので、再発行がない応答では残す。まとめて落とすと
// サインアウトが効かなくなる。
// 再発行がある応答では、同じ応答の session-token の削除も外す。トークンの分割数が変わるときの
// 掃除なので、再発行だけを外すと削除だけが残ってサインアウトになる。
// 名前は前方一致にせず、__Secure- 接頭辞とチャンク（.0 / .1 …）を含む完全一致で判定し、
// 別の cookie を巻き込まない。auth.ts は cookie 名を指定していないため、Auth.js の既定名に
// 合わせている。auth.ts で cookies.sessionToken.name を変えるときは、ここも揃えること。
const SESSION_COOKIE_NAME = /^(__Secure-)?authjs\.session-token(\.\d+)?$/;

function parseSessionCookie(setCookie: string): { isReissue: boolean } | null {
  const [pair] = setCookie.split(";");
  const separator = pair.indexOf("=");
  if (separator === -1) return null;

  const name = pair.slice(0, separator).trim();
  if (!SESSION_COOKIE_NAME.test(name)) return null;

  return { isReissue: pair.slice(separator + 1).trim() !== "" };
}

export function stripSessionCookieReissue(response: Response): void {
  const setCookies = response.headers.getSetCookie();
  const sessionCookies = setCookies.map(parseSessionCookie);
  if (!sessionCookies.some((cookie) => cookie?.isReissue)) return;

  const kept = setCookies.filter((_, index) => sessionCookies[index] === null);
  response.headers.delete("set-cookie");
  kept.forEach((setCookie) => response.headers.append("set-cookie", setCookie));
}
