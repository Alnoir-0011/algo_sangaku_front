// server-only は react-server 条件以外で import すると例外を投げる。
// 単体テストと CT は Server Component の外で動くため、何もしないモジュールに差し替える。
export {};
