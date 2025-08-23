import { auth } from "@/auth";
import {
  authRoutes,
  publicRoutes,
  apiAuthPrefix,
  DEFAULT_LOGIN_REDIRECT,
} from "@/routes";
import { setFlash } from "./app/lib/actions/flash";

export default auth(async (req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  // const isPublicRoute = publicRoutes.includes(nextUrl.pathname);

  let flag = false;
  publicRoutes.map((route) => {
    if (typeof route === "string") {
      if (route === nextUrl.pathname) {
        flag = true;
      }
    } else {
      if (route.test(nextUrl.pathname)) {
        flag = true;
      }
    }
  });

  const isPublicRoute = flag;

  const isAuthRoute = authRoutes.includes(nextUrl.pathname);

  console.log(nextUrl.pathname);

  // NOTE:↓参考URL
  // https://zenn.dev/tsuboi/books/3f7a3056014458/viewer/chapter3#%E3%83%AD%E3%82%B0%E3%82%A4%E3%83%B3%E7%8A%B6%E6%85%8B%E3%81%AB%E5%BF%9C%E3%81%98%E3%81%9F%E3%82%A2%E3%82%AF%E3%82%BB%E3%82%B9%E5%88%B6%E5%BE%A1%E3%81%AE%E5%AE%9F%E8%A3%85
  // ↓元のコード、return null;がtypeエラーのため修正
  //
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
        await setFlash({ type: "warning", message: "サインインしてください" });
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
