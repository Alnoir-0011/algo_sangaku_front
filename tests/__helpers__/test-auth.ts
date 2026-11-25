import { betterAuth } from "better-auth";
import { testUtils } from "better-auth/plugins";
import type { BrowserContext } from "@playwright/test";

import { resolveAuthSecret } from "@/app/lib/auth-secret";
import { cookieAuthOptions } from "@/app/lib/auth-config";

// testUtils は特権のヘルパー（ctx.test）を公開するため、ドキュメントの勧めどおり、本番の認証
// （auth.ts）には入れず、このテスト用のインスタンスにだけ入れる。
// サーバーは cookie cache だけでログインを認めるので、サーバー側にテスト用のサインインの入口を
// 置かず、ここで作った cookie を渡す

// context.addCookies が受ける形（expires は任意）
type SessionCookie = Parameters<BrowserContext["addCookies"]>[0][number];

// import しただけでは throw しない。.env が無い環境でも、テストの一覧は出せるようにする
let testAuth: ReturnType<typeof createTestAuth> | undefined;

// 鍵と baseURL がサーバーと違うと、cookie の署名・暗号化、cookie の名前（https で __Secure- が
// 付く）が合わず、サーバーが cookie を認めない。既定値は置かず、設定が無ければ止める
function createTestAuth() {
  const secret = resolveAuthSecret();
  const baseURL = process.env.BETTER_AUTH_URL;
  if (!secret || !baseURL) {
    throw new Error(
      "BETTER_AUTH_SECRET（または AUTH_SECRET）と BETTER_AUTH_URL が要る。サーバーと同じ値にしないと、サーバーが cookie を認めない。playwright.config.ts が決める",
    );
  }
  return betterAuth({
    secret,
    baseURL,
    ...cookieAuthOptions,
    plugins: [testUtils()],
  });
}

export const getTestAuth = () => (testAuth ??= createTestAuth());

const normalizeSameSite = (sameSite: unknown): "Lax" | "Strict" | "None" => {
  const value = typeof sameSite === "string" ? sameSite.toLowerCase() : "";
  if (value === "strict") return "Strict";
  if (value === "none") return "None";
  return "Lax";
};

const playwrightCookieFrom = (
  setCookie: string,
  base: Omit<SessionCookie, "name" | "value" | "expires">,
): SessionCookie => {
  const [pair, ...attributes] = setCookie.split(";").map((part) => part.trim());
  const separator = pair.indexOf("=");
  const maxAge = attributes
    .find((attribute) => /^max-age=/i.test(attribute))
    ?.split("=")[1];
  return {
    ...base,
    name: pair.slice(0, separator),
    value: pair.slice(separator + 1),
    expires: maxAge
      ? Math.floor(Date.now() / 1000) + Number(maxAge)
      : undefined,
  };
};

export async function createSessionCookies({
  email,
  role = "general",
  accessToken = "dummy_token",
}: {
  email: string;
  role?: "general" | "admin";
  accessToken?: string;
}): Promise<SessionCookie[]> {
  const auth = getTestAuth();
  const context = await auth.$context;
  const user = context.test.createUser({
    email,
    name: email,
    nickname: "test_nickname",
    role,
    railsAccessToken: accessToken,
  });
  await context.test.saveUser(user);

  const login = await context.test.login({
    userId: user.id,
    session: { railsAccessToken: accessToken },
  });
  const [sessionToken] = login.cookies;

  // testUtils は session_data（cookie cache）を作らない。getSession の応答で得る
  const response = await auth.api.getSession({
    headers: login.headers,
    asResponse: true,
  });
  const { name, attributes } = context.authCookies.sessionData;
  const base = {
    domain: sessionToken.domain,
    path: attributes.path ?? "/",
    httpOnly: attributes.httpOnly ?? true,
    secure: attributes.secure ?? false,
    sameSite: normalizeSameSite(attributes.sameSite),
  };
  // 大きいと、${name}.0、${name}.1 のように、チャンクに分かれる
  const sessionData = response.headers
    .getSetCookie()
    .filter(
      (setCookie) =>
        (setCookie.startsWith(`${name}=`) ||
          setCookie.startsWith(`${name}.`)) &&
        !/max-age=0(;|$)/i.test(setCookie),
    )
    .map((setCookie) => playwrightCookieFrom(setCookie, base));

  if (sessionData.length === 0) {
    throw new Error(
      "session_data が発行されなかった。getSession が session を返さなかったか、cookie が大きすぎて cookie cache が作られなかった",
    );
  }
  return [sessionToken, ...sessionData];
}
