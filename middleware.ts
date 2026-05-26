import { auth } from "@/auth";
import {
  authRoutes,
  publicRoutes,
  apiAuthPrefix,
  adminRoutePrefix,
  DEFAULT_LOGIN_REDIRECT,
} from "@/routes";
import { setFlash } from "./app/lib/actions/flash";

export default auth(async (req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  // const isPublicRoute = publicRoutes.includes(nextUrl.pathname);

  const isPublicRoute = publicRoutes.some((route) =>
    typeof route === "string"
      ? route === nextUrl.pathname
      : route.test(nextUrl.pathname),
  );

  const isAuthRoute = authRoutes.includes(nextUrl.pathname);

  const isPrefetch = req.headers.get("Next-Router-Prefetch") === "1";

  const isAdminRoute = nextUrl.pathname.startsWith(adminRoutePrefix);

  if (!isApiAuthRoute) {
    if (isAdminRoute) {
      if (!isLoggedIn) {
        if (!isPrefetch) {
          await setFlash({ type: "warning", message: "サインインしてください" });
        }
        return Response.redirect(new URL("/signin", nextUrl));
      }
      if (req.auth?.role !== "admin") {
        return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
      }
    } else if (!isAuthRoute) {
      if (!isLoggedIn && !isPublicRoute) {
        if (!isPrefetch) {
          await setFlash({ type: "warning", message: "サインインしてください" });
        }
        return Response.redirect(new URL("/signin", nextUrl));
      }
    } else {
      if (isLoggedIn) {
        return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
      }
    }
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
