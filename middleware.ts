import NextAuth from "next-auth";
import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  publicRoutes,
  protectedRoutes,
} from "./routes";

const { auth } = NextAuth({
  providers: [],
  session: { strategy: "jwt" as const },
  pages: {
    signIn: "/login",
    error: "/error",
  },
});

export default auth((req) => {
  console.log("🔍 Middleware - Auth object:", req.auth);

  const isLoggedIn = !!req.auth;
  console.log("isLoggedIn:", isLoggedIn);

  const { nextUrl } = req;
  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);
  const isProtectedRoute = protectedRoutes.includes(nextUrl.pathname);

  if (isApiAuthRoute) return null;
  if (isAuthRoute && isLoggedIn) return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
  if (!isLoggedIn && isProtectedRoute) return Response.redirect(new URL("/login", nextUrl));

  return null;
});
