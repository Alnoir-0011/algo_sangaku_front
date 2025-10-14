export const publicRoutes: (string | RegExp)[] = [
  "/",
  "/shrines",
  /\/shrines\/.*\/sangakus/,
  "/privacy_policy",
  "/terms_of_use",
];

export const authRoutes: string[] = ["/signin"];

export const apiAuthPrefix: string = "/api/auth";

export const DEFAULT_LOGIN_REDIRECT: string = "/";
