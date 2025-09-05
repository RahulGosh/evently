// middleware.ts
import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "./lib/db"; // adjust if your prisma client path is different
import type { UserRole } from "@prisma/client";

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const pathname = req.nextUrl.pathname;

  // ✅ Public routes
  const publicRoutes = ["/", "/sign-in", "/sign-up"];
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // 🚫 Redirect unauthenticated users to sign-in
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // ✅ Get user role from DB
  const dbUser = await db.user.findUnique({
    where: { clerkId: userId },
    select: { role: true },
  });

  const role = dbUser?.role as UserRole | null;

  // 🚫 Protect /admin routes → only allow ADMIN
  if (pathname.startsWith("/admin")) {
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url)); // redirect non-admins to home
    }
  }

  // ✅ Allow all other authenticated routes
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals + static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
