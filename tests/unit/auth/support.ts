import { afterEach, vi, type Mock } from "vitest";

import type { auth as Auth } from "@/auth";

export const ORIGIN = "http://localhost:4020";

// 呼び出しのたびに globalThis.fetch を包むと、stub が連鎖して、unstub を忘れたテストに漏れる。
// 読み込み時点の fetch を使えば、何度 stub しても 1 段で済む
const realFetch = globalThis.fetch;

const base64Url = (value: unknown) =>
  Buffer.from(JSON.stringify(value)).toString("base64url");

// 署名は検証されないため、ダミーでよい
export const idTokenOf = (claims: Record<string, unknown>) =>
  [base64Url({}), base64Url(claims), "signature"].join(".");

export function stubGoogleTokenEndpoint(idToken: string) {
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
      return realFetch(input, init);
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

const issuesSessionToken = (response: Response) =>
  response.headers
    .getSetCookie()
    .some(
      (setCookie) =>
        /better-auth\.session_token=[^;]+/.test(setCookie) &&
        !/max-age=0/i.test(setCookie),
    );

type Identity = { cookie?: string; email?: string; sub?: string };

// 実際の流れ（サインインの開始 → state cookie → Google からのコールバック）を通す。
// Google のトークンは stubGoogleTokenEndpoint で用意する
async function callGoogleCallback(auth: typeof Auth, cookie: string, origin: string) {
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

// サインインに失敗した結果で、否定のアサート（失効しない、cookie が無い、など）が、
// 失敗のせいで通ってしまわないよう、成功を前提とする側は signIn、失敗を確かめる側は
// attemptSignIn を使う
export function createAuthKit(
  auth: typeof Auth,
  serverFetchMock: Mock,
  origin = ORIGIN,
) {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // サインインのたびに、バックエンドは新しい ApiKey を発行する
  const backendIssues = (accessToken: string) =>
    serverFetchMock.mockImplementation(
      async () =>
        new Response(
          JSON.stringify({
            data: { attributes: { nickname: "nick", role: "admin" } },
          }),
          { status: 200, headers: { accesstoken: accessToken } },
        ),
    );

  const attemptSignIn = (
    accessToken: string,
    {
      cookie = "",
      email = "me@example.com",
      sub = "google-sub",
    }: Identity = {},
  ) => {
    backendIssues(accessToken);
    stubGoogleTokenEndpoint(idTokenOf({ sub, email, name: "Me" }));
    return callGoogleCallback(auth, cookie, origin);
  };

  const signIn = async (accessToken: string, identity: Identity = {}) => {
    const result = await attemptSignIn(accessToken, identity);

    const location = result.response.headers.get("location") ?? "";
    if (location.includes("error=") || !issuesSessionToken(result.response)) {
      throw new Error(
        `サインインに失敗しました（location: ${location}、status: ${result.response.status}）`,
      );
    }
    return result;
  };

  // ブラウザからの要求を再現する。Origin の検査は、Better Auth がテスト環境で無効にするため、
  // ここでは確認できない（実機で、他オリジンの POST が 403 になることを確認済み）
  const post = (path: string, body: unknown, cookie?: string) =>
    auth.handler(
      new Request(`${origin}/api/auth${path}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin,
          ...(cookie ? { cookie } : {}),
        },
        body: JSON.stringify(body),
      }),
    );

  const get = (path: string, cookie?: string) =>
    auth.handler(
      new Request(`${origin}/api/auth${path}`, {
        headers: cookie ? { cookie } : {},
      }),
    );

  return { attemptSignIn, signIn, post, get, backendIssues };
}
