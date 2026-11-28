import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";

// beforeEach では設定しない。auth.ts は import の時点で、環境変数から設定を作るため
vi.hoisted(() => {
  process.env.BETTER_AUTH_SECRET = "test-secret-for-session-cookie-0123456789";
  process.env.BETTER_AUTH_URL = "http://localhost:4020";
  process.env.AUTH_GOOGLE_ID = "google-client-id";
  process.env.AUTH_GOOGLE_SECRET = "google-client-secret";
  process.env.API_URL = "http://api.test";
});

const { serverFetchMock } = vi.hoisted(() => ({ serverFetchMock: vi.fn() }));

vi.mock("@/app/lib/server-fetch", () => ({ serverFetch: serverFetchMock }));
vi.mock("@/app/lib/set-flash", () => ({ setFlash: vi.fn() }));

import { auth } from "@/auth";
import { createAuthKit, mergeCookies } from "@/tests/unit/auth/support";

const { signIn, get } = createAuthKit(auth, serverFetchMock);

const DAY = 24 * 60 * 60 * 1000;

const setCookieOf = (response: Response, name: string) =>
  response.headers
    .getSetCookie()
    .find((setCookie) => setCookie.startsWith(`better-auth.${name}=`));

const sessionOf = (cookie: string) =>
  auth.api.getSession({ headers: new Headers({ cookie }) });

// セッションの有効期間
describe("session lifetime", () => {
  let signedInAt = 0;

  beforeEach(() => {
    signedInAt = Date.now();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // 2 回目の useFakeTimers は、その時点の偽の時刻から数え始める。起点を固定して、
  // 何日目かをテストに書いた数字のとおりにする
  const afterDays = (days: number, extraMs = 0) =>
    vi.useFakeTimers({
      toFake: ["Date"],
      now: signedInAt + days * DAY + extraMs,
    });

  const reissuesSessionToken = (response: Response) => {
    const setCookie = setCookieOf(response, "session_token");
    return setCookie !== undefined && !/max-age=0/i.test(setCookie);
  };

  // 2 日後に Cookie キャッシュを飛ばしても、セッションが延長されない
  test("should not allow my session to be extended when I skip the cookie cache after 2 days", async () => {
    const { cookie } = await signIn("my-token");
    const before = await sessionOf(cookie);
    afterDays(2);

    const response = await auth.api.getSession({
      headers: new Headers({ cookie }),
      query: { disableCookieCache: true },
      asResponse: true,
    });
    const after = await response.json();

    expect(new Date(after.session.expiresAt).getTime()).toBe(
      before!.session.expiresAt.getTime(),
    );
    expect(reissuesSessionToken(response)).toBe(false);
  });

  // session_data は、再発行されて、cookie としての寿命が 7 日に戻る。中身の expiresAt は
  // 変わらないため、再発行された cookie を持っていても、7 日で切れなければならない
  // 再発行された Cookie でも、7 日後にはサインインしたままでいられない
  test("should not allow me to stay signed in after 7 days with the cookie that was issued again", async () => {
    const { cookie } = await signIn("my-token");
    afterDays(2);
    const response = await auth.api.getSession({
      headers: new Headers({ cookie }),
      query: { disableCookieCache: true },
      asResponse: true,
    });
    const reissued = mergeCookies(cookie, response);

    afterDays(7, 1000);

    expect(await sessionOf(reissued)).toBeNull();
  });

  // 7 日後には、サインインしたままでいられない
  test("should not allow me to stay signed in after 7 days", async () => {
    const { cookie } = await signIn("my-token");
    afterDays(7, 1000);

    expect(await sessionOf(cookie)).toBeNull();
  });

  // ニックネームを更新しても、セッションを 7 日より先に延ばせない
  test("should not allow me to extend my session beyond 7 days by updating my nickname", async () => {
    const { cookie } = await signIn("my-token");
    afterDays(6);
    const response = await auth.api.updateUser({
      body: { nickname: "new nick" },
      headers: new Headers({ cookie }),
      asResponse: true,
    });
    const updated = mergeCookies(cookie, response);

    expect(await sessionOf(updated)).toMatchObject({
      user: { nickname: "new nick" },
    });

    afterDays(7, 1000);

    expect(await sessionOf(updated)).toBeNull();
  });
});

// サインイン後の Cookie
describe("cookies after signing in", () => {
  // Google から受け取ったトークンを、ブラウザに残せない
  test("should not allow me to keep the tokens from Google in my browser", async () => {
    const { response } = await signIn("my-token");

    const names = response.headers
      .getSetCookie()
      .map((setCookie) => setCookie.split("=")[0]);
    expect(names).toContain("better-auth.session_token");
    expect(names.some((name) => name.endsWith("account_data"))).toBe(false);
  });

  // Secure は、https の公開 URL でだけ付く。その確認は cookie-attributes.test.ts に任せる
  // http でサインインしても、https でしか保持できない Cookie（%s）が付かない
  test.each(["session_token", "session_data"])(
    "should allow me to sign in on http without a cookie that only https can keep (%s)",
    async (name) => {
      const { response } = await signIn("my-token");

      expect(setCookieOf(response, name)).not.toMatch(/;\s*Secure/i);
    },
  );
});

// ブラウザ向けのセッションデータ
describe("session data for the browser", () => {
  // セッションでアクセストークンを受け取れない
  test("should not allow me to receive my access token in the session", async () => {
    const { cookie } = await signIn("secret-token");

    const response = await get("/get-session", cookie);
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain('"nickname":"nick"');
    expect(body).not.toContain("secret-token");
    expect(body).not.toContain("railsAccessToken");
    for (const setCookie of response.headers.getSetCookie()) {
      expect(setCookie).not.toContain("secret-token");
    }
  });

  // ブラウザでニックネームとロールが見える
  test("should allow me to see my nickname and role in the browser", async () => {
    const { cookie } = await signIn("secret-token");

    const response = await get("/get-session", cookie);

    expect((await response.json()).user).toMatchObject({
      nickname: "nick",
      role: "admin",
    });
  });

  // Cookie だけでサインインしたままでいられる
  test("should allow me to stay signed in with only my cookie", async () => {
    const { cookie } = await signIn("secret-token");

    const session = await sessionOf(cookie);

    expect(session?.session).toMatchObject({
      railsAccessToken: "secret-token",
    });
    expect(session?.user).toMatchObject({ nickname: "nick", role: "admin" });
  });

  // 拒否リスト（railsAccessToken だけを除く）だと、項目を足したときに、除き忘れて漏れる
  // ブラウザで、許可リストにあるフィールドだけが見える
  test("should allow me to see only the fields that are listed in the browser", async () => {
    const { cookie } = await signIn("secret-token");

    const body = await (await get("/get-session", cookie)).json();

    expect(Object.keys(body.session).sort()).toEqual([
      "createdAt",
      "expiresAt",
      "id",
      "updatedAt",
    ]);
    expect(Object.keys(body.user)).toEqual(
      expect.arrayContaining(["id", "email", "name", "nickname", "role"]),
    );
    expect([
      "createdAt",
      "email",
      "emailVerified",
      "id",
      "image",
      "name",
      "nickname",
      "role",
      "updatedAt",
    ]).toEqual(expect.arrayContaining(Object.keys(body.user)));
  });
});
