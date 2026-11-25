// auth.ts と、E2E のテスト用の認証インスタンス（tests/__helpers__/test-auth.ts）で共有する。
// 食い違うと、テスト側で作った cookie をサーバーが認めない。Playwright のプロセスからも
// 読むため、server-only などを import しない

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

// Rails の nickname・role は利用者の記録（同じメールの端末で共有される）に、ApiKey は
// 端末ごとの session の記録に置く。ApiKey を user に置くと、別の端末のサインインや
// updateUser の戻り値（共有の記録）で、cookie のトークンが別の端末のものに入れ替わる。
// user の railsAccessToken は、サインイン時に getUserInfo から session へ渡す運び役だけで、
// returned: false にして、cookie にも HTTP 応答にも出さない。input は true のまま
// （false だと、getUserInfo が返した値が無視される。db/schema.mjs の
// parseAdditionalUserInputFromProviderProfile）。ブラウザから update-user で書き換えられない
// のは、許可リストで HTTP 経由を拒否しているため
export const userAdditionalFields = {
  railsAccessToken: { type: "string", required: false, returned: false },
  nickname: { type: "string", required: false },
  role: { type: "string", required: false },
} as const;

// session の項目は、cookie cache（JWE）に入る。サーバーだけが書くので input: false
export const sessionAdditionalFields = {
  railsAccessToken: { type: "string", required: false, input: false },
} as const;

export const sessionOptions = {
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
} as const;

// cookie の中身と検証に関わる設定は、すべてここに置く。auth.ts にだけ足すと、テストの cookie が
// 古い形のまま残る（tests/unit/test-auth.test.ts が、両方の cookie の名前と属性の一致を確かめる）
export const cookieAuthOptions = {
  session: sessionOptions,
  user: { additionalFields: userAdditionalFields },
} as const;
