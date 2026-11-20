import { describe, test, expect } from "vitest";

import { railsUserOf, toRailsUser } from "@/app/lib/rails-user";

const session = { id: "s1", railsAccessToken: "token" };
const user = { id: "u1", email: "me@example.com", nickname: "nick", role: "admin" };

describe("railsUserOf", () => {
  test("should allow me to get my access token, nickname and role from my session", () => {
    expect(railsUserOf({ session, user })).toEqual({
      accessToken: "token",
      nickname: "nick",
      role: "admin",
    });
  });

  test("should allow a general user to be told from an admin", () => {
    expect(railsUserOf({ session, user: { ...user, role: "general" } })?.role).toBe(
      "general",
    );
  });

  test("should not allow my access token to be read from my user", () => {
    expect(
      railsUserOf({
        session: { id: "s1" },
        user: { ...user, railsAccessToken: "token" },
      }),
    ).toBeNull();
  });

  test.each([null, undefined])(
    "should not allow me to be signed in without a session (%j)",
    (value) => {
      expect(railsUserOf(value)).toBeNull();
    },
  );

  test.each([
    ["session is missing", { user }],
    ["user is missing", { session }],
  ])("should not allow me to be signed in when %s", (_label, value) => {
    expect(railsUserOf(value)).toBeNull();
  });

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

describe("toRailsUser", () => {
  test("should allow the fields the backend gave to be accepted", () => {
    expect(
      toRailsUser({ accessToken: "token", nickname: "nick", role: "general" }),
    ).toEqual({ accessToken: "token", nickname: "nick", role: "general" });
  });

  test.each([
    ["accessToken is empty", { accessToken: "", nickname: "n", role: "admin" }],
    ["nickname is null", { accessToken: "t", nickname: null, role: "admin" }],
    ["role is unknown", { accessToken: "t", nickname: "n", role: "x" }],
  ])("should not allow the fields to be accepted when %s", (_label, fields) => {
    expect(toRailsUser(fields)).toBeNull();
  });
});
