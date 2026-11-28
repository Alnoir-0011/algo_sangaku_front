import { describe, test, expect } from "vitest";

import { railsUserOf, toRailsUser } from "@/app/lib/rails-user";

const session = { id: "s1", railsAccessToken: "token" };
const user = { id: "u1", email: "me@example.com", nickname: "nick", role: "admin" };

// railsUserOf（セッションからの Rails ユーザーの取得）
describe("railsUserOf", () => {
  // セッションから、アクセストークン・ニックネーム・ロールを取得できる
  test("should allow me to get my access token, nickname and role from my session", () => {
    expect(railsUserOf({ session, user })).toEqual({
      accessToken: "token",
      nickname: "nick",
      role: "admin",
    });
  });

  // 一般ユーザーと管理者を区別できる
  test("should allow a general user to be told from an admin", () => {
    expect(railsUserOf({ session, user: { ...user, role: "general" } })?.role).toBe(
      "general",
    );
  });

  // ユーザーからアクセストークンを読み取れない
  test("should not allow my access token to be read from my user", () => {
    expect(
      railsUserOf({
        session: { id: "s1" },
        user: { ...user, railsAccessToken: "token" },
      }),
    ).toBeNull();
  });

  // セッションがなければ、サインイン状態にならない（%j）
  test.each([null, undefined])(
    "should not allow me to be signed in without a session (%j)",
    (value) => {
      expect(railsUserOf(value)).toBeNull();
    },
  );

  // %s のとき、サインイン状態にならない
  test.each([
    ["session is missing", { user }],
    ["user is missing", { session }],
  ])("should not allow me to be signed in when %s", (_label, value) => {
    expect(railsUserOf(value)).toBeNull();
  });

  // %s のとき、サインイン状態にならない
  test.each([
    ["railsAccessToken is missing", { session: { id: "s1" }, user }],
    [
      "railsAccessToken is empty",
      { session: { ...session, railsAccessToken: "" }, user },
    ],
    [
      "railsAccessToken is not a string",
      { session: { ...session, railsAccessToken: 1 }, user },
    ],
    ["nickname is missing", { session, user: { ...user, nickname: undefined } }],
    ["nickname is not a string", { session, user: { ...user, nickname: 1 } }],
    ["role is missing", { session, user: { ...user, role: undefined } }],
    ["role is unknown", { session, user: { ...user, role: "owner" } }],
  ])("should not allow me to be signed in when %s", (_label, value) => {
    expect(railsUserOf(value)).toBeNull();
  });
});

// toRailsUser（バックエンドの値からの Rails ユーザー変換）
describe("toRailsUser", () => {
  // バックエンドが返したフィールドを受け入れられる
  test("should allow the fields the backend gave to be accepted", () => {
    expect(
      toRailsUser({ accessToken: "token", nickname: "nick", role: "general" }),
    ).toEqual({ accessToken: "token", nickname: "nick", role: "general" });
  });

  // %s のとき、フィールドを受け入れない
  test.each([
    ["accessToken is empty", { accessToken: "", nickname: "n", role: "admin" }],
    ["nickname is null", { accessToken: "t", nickname: null, role: "admin" }],
    ["role is unknown", { accessToken: "t", nickname: "n", role: "x" }],
  ])("should not allow the fields to be accepted when %s", (_label, fields) => {
    expect(toRailsUser(fields)).toBeNull();
  });
});
