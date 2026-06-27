export const publicRoutes: (string | RegExp)[] = [
  "/",
  "/shrines",
  /^\/shrines\/[^/]+\/sangakus$/,
  /^\/profiles\/.+$/,
  "/privacy_policy",
  "/terms_of_use",
];

export const authRoutes: string[] = ["/signin"];

export const apiAuthPrefix: string = "/api/auth";

export const adminRoutePrefix: string = "/admin";

export const DEFAULT_LOGIN_REDIRECT: string = "/";

export const profilePath = (id: string) => `/profiles/${id}`;
