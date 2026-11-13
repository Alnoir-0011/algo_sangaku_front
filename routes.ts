export const publicRoutes: (string | RegExp)[] = [
  "/",
  "/shrines",
  /^\/shrines\/[^/]+\/sangakus$/,
  /^\/profiles\/.+$/,
  /^\/play\/reorder\/\d+$/,
  "/privacy_policy",
  "/terms_of_use",
];

export const isPublicPath = (pathname: string): boolean =>
  publicRoutes.some((route) =>
    typeof route === "string" ? route === pathname : route.test(pathname),
  );

export const authRoutes: string[] = ["/signin"];

export const signinPath: string = "/signin";

export const apiAuthPrefix: string = "/api/auth";

export const adminRoutePrefix: string = "/admin";

export const DEFAULT_LOGIN_REDIRECT: string = "/";

export const profilePath = (id: string) => `/profiles/${id}`;

export const guestReorderPath = (id: string) => `/play/reorder/${id}`;

export const shrineSangakusPath = (shrineId: string) =>
  `/shrines/${shrineId}/sangakus`;
