import { vi } from "vitest";

import type { auth as Auth } from "@/auth";

const ORIGIN = "http://localhost:4020";

const base64Url = (value: unknown) =>
  Buffer.from(JSON.stringify(value)).toString("base64url");

// 署名は検証されないため、ダミーでよい
export const idTokenOf = (claims: Record<string, unknown>) =>
  [base64Url({}), base64Url(claims), "signature"].join(".");

// Google のトークンエンドポイントだけを差し替える。呼び出し側で vi.unstubAllGlobals() すること
export function stubGoogleTokenEndpoint(idToken: string) {
  const originalFetch = globalThis.fetch;
  vi.stubGlobal(
    "fetch",
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      if (url.startsWith("https://oauth2.googleapis.com/token")) {
        return new Response(
          JSON.stringify({
            access_token: "google-access-token",
            id_token: idToken,
            expires_in: 3600,
            token_type: "Bearer",
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }
      return originalFetch(input, init);
    },
  );
}

// 既存の cookie ヘッダーに、応答の Set-Cookie を反映した cookie ヘッダーを返す
export function mergeCookies(cookie: string, response: Response) {
  const jar = new Map(
    cookie
      .split("; ")
      .filter(Boolean)
      .map((pair) => {
        const index = pair.indexOf("=");
        return [pair.slice(0, index), pair.slice(index + 1)] as const;
      }),
  );
  for (const line of response.headers.getSetCookie()) {
    const [pair] = line.split(";");
    const index = pair.indexOf("=");
    const name = pair.slice(0, index);
    const value = pair.slice(index + 1);
    if (/max-age=0/i.test(line) || value === "") jar.delete(name);
    else jar.set(name, value);
  }
  return [...jar].map(([name, value]) => `${name}=${value}`).join("; ");
}

// 実際の流れ（サインインの開始 → state cookie → Google からのコールバック）を通して、
// サインイン後の cookie を得る。Google のトークンは stubGoogleTokenEndpoint で用意する
export async function signInWithGoogle(
  auth: typeof Auth,
  cookie = "",
  origin = ORIGIN,
) {
  const start = await auth.api.signInSocial({
    body: { provider: "google", callbackURL: "/" },
    asResponse: true,
  });
  const withState = mergeCookies(cookie, start);
  const { url } = (await start.json()) as { url: string };
  const state = new URL(url).searchParams.get("state");

  const response = await auth.handler(
    new Request(
      `${origin}/api/auth/callback/google?code=code&state=${state}`,
      { headers: { cookie: withState } },
    ),
  );
  return { response, cookie: mergeCookies(withState, response) };
}
