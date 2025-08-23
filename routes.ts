export const publicRoutes: (string | RegExp)[] = [
  "/",
  "/shrines",
  /\/shrines\/.*\/sangakus/,
];

export const authRoutes: string[] = ["/signin"];

export const apiAuthPrefix: string = "/api/auth";

export const DEFAULT_LOGIN_REDIRECT: string = "/";
