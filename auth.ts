import { betterAuth } from "better-auth";
import {
  APIError,
  createAuthMiddleware,
  getSessionFromCtx,
} from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { customSession } from "better-auth/plugins";
import type { GoogleProfile } from "better-auth/social-providers";

import { setFlash } from "@/app/lib/set-flash";
import { serverFetch } from "@/app/lib/server-fetch";
import { apiUrl } from "@/app/lib/config";
import { DEFAULT_NETWORK_TIMEOUT_MS } from "@/app/lib/constants";
import { revokeRailsApiKey, withTimeout } from "@/app/lib/rails-api-key";
import { railsUserOf, toRailsUser } from "@/app/lib/rails-user";
import { resolveAuthSecret } from "@/app/lib/auth-secret";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

// ブラウザから /api/auth/* 経由で呼ばせるのは、使うエンドポイントだけにする。
// 標準では update-user（name・image の書き換え）、revoke-*、link-social なども
// 呼べるため、拒否リストにすると、標準や設定の変更で増えたものを塞ぎ損なう。
// main の Auth.js でも、ブラウザからのセッション更新を拒否していた。
// このリストは auth.api.* のサーバー側からの直接呼び出しにも効く。
// サーバーから別のエンドポイント（updateUser など）を呼ぶ場合は、SERVER_ONLY_AUTH_PATHS に足す
const BROWSER_AUTH_PATHS = new Set([
  "/ok",
  "/error",
  "/get-session",
  "/sign-out",
  "/callback/:id",
]);

// ブラウザから POST /api/auth/sign-in/social を呼び、body に idToken を付けると、
// OAuth の state と PKCE を通らずにサインインできる（sign-in.mjs の idToken 経路）。
// 上書きした getUserInfo を経由して Rails の /authenticate まで進むため、漏えいした
// id_token がそのままサインインに使える。サインイン画面は Server Action から
// auth.api.signInSocial を呼ぶだけなので、HTTP 経由（ctx.request あり）では閉じる
//
// テスト環境（APP_ENV=test）だけは、E2E 用のサインイン（app/lib/actions/test-sign-in.ts）が
// メールとパスワードで Better Auth のセッションを作るため、その 2 つも足す。
// main の Auth.js も、同じ条件で Credentials プロバイダーを足していた
const isTestEnv = process.env.APP_ENV === "test";

// /update-user は nickname の更新（app/lib/session.ts の updateSessionNickname）に使う。
// ブラウザから呼べると、user の項目に載せた role や ApiKey を書き換えられる
const SERVER_ONLY_AUTH_PATHS = new Set([
  "/sign-in/social",
  "/update-user",
  ...(isTestEnv ? ["/sign-in/email", "/sign-up/email"] : []),
]);

// バックエンドが 401 を返したあとのサインアウトでは、失効済みの ApiKey に DELETE を送らない。
// サーバーからの呼び出し（ctx.request なし）のときだけ有効にする。ブラウザが付けても、
// 自分の ApiKey を失効させないだけだが、HTTP 経由では無視する
export const SKIP_API_KEY_REVOCATION_HEADER = "x-skip-api-key-revocation";

// ブラウザから渡せるクエリのうち、cookie cache を使わずに、メモリアダプターを引かせるもの。
// 引かれると、同じ利用者の別の端末の記録や、ない記録（cold start）に基づいて、cookie が
// 書き換わるか消える。get-session だけでなく、フック内の getSessionFromCtx も、ctx.query を
// 取り込むため、すべてのパスで拒否する
const COOKIE_CACHE_BYPASS_QUERIES = ["disableCookieCache", "disableRefresh"];

// Google のトークンエンドポイントから直接受け取った id_token なので、署名は検証しない
// （Better Auth 標準の Google プロバイダーも decodeJwt のみ）。検証は Rails が行う
const decodeClaims = (idToken: string): GoogleProfile =>
  JSON.parse(Buffer.from(idToken.split(".")[1], "base64url").toString());

// before フックで読んだ、サインイン前の ApiKey を、after フックへ渡す
const previousApiKeys = new WeakMap<object, string>();

// Rails の nickname・role は利用者の記録（同じメールの端末で共有される）に、ApiKey は
// 端末ごとの session の記録に置く。ApiKey を user に置くと、別の端末のサインインや
// updateUser の戻り値（共有の記録）で、cookie のトークンが別の端末のものに入れ替わる。
// user の railsAccessToken は、サインイン時に getUserInfo から session へ渡す運び役だけで、
// returned: false にして、cookie にも HTTP 応答にも出さない。input は true のまま
// （false だと、getUserInfo が返した値が無視される。db/schema.mjs の
// parseAdditionalUserInputFromProviderProfile）。ブラウザから update-user で書き換えられない
// のは、許可リストで HTTP 経由を拒否しているため
const userAdditionalFields = {
  railsAccessToken: { type: "string", required: false, returned: false },
  nickname: { type: "string", required: false },
  role: { type: "string", required: false },
} as const;

// session の項目は、cookie cache（JWE）に入る。サーバーだけが書くので input: false
const sessionAdditionalFields = {
  railsAccessToken: { type: "string", required: false, input: false },
} as const;

export const auth = betterAuth({
  // database を渡さない。ステートレス（署名・暗号化した cookie のみ）で動く
  secret: resolveAuthSecret(),
  session: {
    expiresIn: SESSION_MAX_AGE_SECONDS,
    // cookie cache を使えない経路（memory adapter を引く経路）でも、updateAge を超えたときに
    // 有効期限を延ばして cookie を再発行しない。ApiKey はログインから 7 日で失効するため
    disableSessionRefresh: true,
    additionalFields: sessionAdditionalFields,
    cookieCache: {
      enabled: true,
      maxAge: SESSION_MAX_AGE_SECONDS,
      strategy: "jwe",
      // 延長しない。ログインから 7 日で ApiKey も失効するため、セッションだけ延びると食い違う
      refreshCache: false,
    },
  },
  // Better Auth のレート制限は、本番で既定が有効（同じ IP・同じパスで 10 秒あたり 100 件）。
  // get-session は、SessionSync・refetchInterval・フォーカス復帰で、同じ IP（学校やオフィスの
  // NAT など）から多数届く。cookie の復号だけで DB を引かない軽い処理だが、未認証でも叩ける
  // ため、無制限にはせず、既定より大きい上限にする。制限に当たると 429 を返し、
  // E2E でも 1 件が失敗した。他のパスの制限は、既定のまま
  rateLimit: {
    customRules: { "/get-session": { window: 10, max: 300 } },
  },
  // DB がないと、Google の access_token / id_token を暗号化した account_data cookie
  // （約 2.9KB）に 7 日間残すのが既定になる。トークンを後から使う機能は無く、cookie が
  // 大きくなるだけなので、保存しない。storeStateStrategy は、DB なしの既定を保つために明記する
  account: { storeStateStrategy: "cookie", storeAccountCookie: false },
  user: { additionalFields: userAdditionalFields },
  // サインインの失敗は、state の不一致などでも、英語の既定のエラーページではなく、
  // サインイン画面の通知（?error=）に集める
  onAPIError: { errorURL: "/signin" },
  emailAndPassword: { enabled: isTestEnv },
  databaseHooks: {
    session: {
      create: {
        // session の記録は、サインインの要求の中で作られる。直前に、利用者の記録へ入れた
        // このサインインのトークンを、session の記録へ写す。別の要求が、同じ利用者の記録を
        // 書き換える間に挟まる余地はあるが、その要求は同じ利用者の別のサインインに限る
        before: async (session, ctx) => {
          const user = await ctx?.context.internalAdapter.findUserById(
            session.userId,
          );
          const token = (user as Record<string, unknown> | null)
            ?.railsAccessToken;
          return {
            data: {
              ...session,
              railsAccessToken: typeof token === "string" ? token : undefined,
            },
          };
        },
      },
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      // false だと、メモリアダプターに残った同じメールの利用者の記録が前回のトークンを
      // 持ち越し、その値が session の記録へ写される（link-account.mjs の handleOAuthUserInfo）
      overrideUserInfoOnSignIn: true,
      // mapProfileToUser は claims しか受け取らず id_token を渡せない。
      // Rails の認証には id_token が要るため、getUserInfo を上書きする
      async getUserInfo(tokens) {
        if (!tokens.idToken) return null;

        try {
          // 失敗しうる処理（claims の解読、email と sub の確認）を、副作用（Rails の ApiKey の
          // 発行）より先に行う。sub が無いと、Better Auth がこの後で失敗し、発行した ApiKey が
          // 孤児になる（oauth2/account-key.mjs）
          const claims = decodeClaims(tokens.idToken);
          if (!claims.email || !claims.sub) return null;

          const authenticated = await withTimeout(
            DEFAULT_NETWORK_TIMEOUT_MS,
            async (signal) => {
              const response = await serverFetch(
                `${apiUrl}/api/v1/authenticate`,
                {
                  method: "POST",
                  body: JSON.stringify({ token: tokens.idToken }),
                  signal,
                },
              );
              if (response.status !== 200) return null;

              const accessToken = response.headers.get("accesstoken");
              if (!accessToken) return null;
              const body = await response.json();
              return { accessToken, attributes: body.data.attributes };
            },
          );
          if (!authenticated) return null;

          // ログイン判定（railsUserOf）と同じ検証。ここで通らない値を返すと、サインインに
          // 成功した直後に、ログインしていない状態になり、発行した ApiKey も残る
          const rails = toRailsUser({
            accessToken: authenticated.accessToken,
            nickname: authenticated.attributes.nickname,
            role: authenticated.attributes.role,
          });
          if (!rails) {
            await revokeRailsApiKey(authenticated.accessToken);
            return null;
          }

          return {
            user: {
              name: claims.name ?? "",
              email: claims.email,
              image: claims.picture,
              emailVerified: claims.email_verified ?? false,
              railsAccessToken: rails.accessToken,
              nickname: rails.nickname,
              role: rails.role,
            },
            data: claims,
          };
        } catch (error) {
          console.error("[auth] signIn error:", error);
          return null;
        }
      },
    },
  },
  hooks: {
    // サーバー側（Server Action）でもクライアントの authClient.signOut() でも同じ経路で
    // ApiKey を失効させるため、/sign-out のフックに置く
    before: createAuthMiddleware(async (ctx) => {
      const isAllowed =
        BROWSER_AUTH_PATHS.has(ctx.path) ||
        (!ctx.request && SERVER_ONLY_AUTH_PATHS.has(ctx.path));
      if (!isAllowed) {
        throw new APIError("NOT_FOUND", { message: "Not found" });
      }

      if (
        ctx.request &&
        COOKIE_CACHE_BYPASS_QUERIES.some((name) => name in (ctx.query ?? {}))
      ) {
        throw new APIError("BAD_REQUEST", { message: "Bad request" });
      }

      if (ctx.path === "/sign-out") {
        const skipsRevocation =
          !ctx.request &&
          ctx.headers?.get(SKIP_API_KEY_REVOCATION_HEADER) === "1";
        if (skipsRevocation) return;

        const current = railsUserOf(await getSessionFromCtx(ctx));
        if (current) await revokeRailsApiKey(current.accessToken);
        return;
      }

      // サインインに成功するまで失効させない。ここで失効させると、失敗やキャンセルの
      // コールバック（GET /api/auth/callback/google?error=...）を踏ませるだけで、
      // サインイン中の利用者の ApiKey を失効させられる
      if (ctx.path === "/callback/:id") {
        const previous = railsUserOf(await getSessionFromCtx(ctx));
        if (previous) previousApiKeys.set(ctx.context, previous.accessToken);
      }
    }),
    // newSession があるのは、サインインに成功したときだけ。成功の通知も、ここで書く。
    // getUserInfo の中で書くと、その後の失敗（リンクの拒否など）で、失敗の表示と同時に出る
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/callback/:id" || !ctx.context.newSession) return;

      await setFlash({ type: "success", message: "サインインしました" });

      // 上書きされる前の ApiKey は、そのままだと失効されずに残る
      const previous = previousApiKeys.get(ctx.context);
      const issued = railsUserOf(ctx.context.newSession)?.accessToken;
      if (previous && previous !== issued) await revokeRailsApiKey(previous);
    }),
  },
  plugins: [
    // ブラウザへの応答（ctx.request がある HTTP 経由）は、返す項目を列挙する。
    // 拒否リスト（railsAccessToken を除く）だと、user や session に項目を足したときに、
    // 除き忘れて漏れる。session の token・ipAddress・userAgent も、ブラウザには要らない。
    // サーバー側の auth.api.getSession（ctx.request なし）には、そのまま返す。
    // 型はサーバー側の形に合わせ、HTTP 応答は絞った形を、同じ型として返す
    customSession(
      async (session, ctx) => {
        if (!ctx.request) return session;

        const { user } = session;
        return {
          session: {
            id: session.session.id,
            expiresAt: session.session.expiresAt,
            createdAt: session.session.createdAt,
            updatedAt: session.session.updatedAt,
          },
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            emailVerified: user.emailVerified,
            image: user.image,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            nickname: user.nickname,
            role: user.role,
          },
        } as unknown as typeof session;
      },
      {
        user: { additionalFields: userAdditionalFields },
        session: { additionalFields: sessionAdditionalFields },
      },
    ),
    // 最後に置く必要がある
    nextCookies(),
  ],
});
