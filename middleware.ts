import { auth } from "@/auth";
import {
  authRoutes,
  publicRoutes,
  apiAuthPrefix,
  DEFAULT_LOGIN_REDIRECT,
} from "@/routes";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);

  // ↓元のコード、return null;がtypeエラーのため修正
  // if (isApiAuthRoute) {
  //   return null;
  // }
  //
  // if (isAuthRoute) {
  //   if (isLoggedIn) {
  //     return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
  //   }
  //   return null;
  // }
  //
  // if (!isLoggedIn && !isPublicRoute) {
  //   return Response.redirect(new URL('/login', nextUrl));
  // }
  //
  // return null;

  if (!isApiAuthRoute) {
    if (!isAuthRoute) {
      if (!isLoggedIn && !isPublicRoute) {
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
