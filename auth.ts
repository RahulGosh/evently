import NextAuth, { DefaultSession } from "next-auth";
import authConfig from "./auth.config";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { db } from "./lib/db";
import { getUserById } from "./lib/actions/user.action";
import { UserRole } from "@prisma/client";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  ...authConfig,
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  events: {
    async linkAccount({ user }) {
      await db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (!token.sub) return token;

      // Fetch latest user data to get updated role
      const existingUser = await getUserById(token.sub);
      if (!existingUser) return token;

      token.role = existingUser.role;
      token.isAdmin = existingUser.isAdmin;

      return token;
    },  

    async session({ token, session }) {
      console.log("🔄 Updating session with latest user role:", token.role);

      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      if (token.role && session.user) {
        session.user.role = token.role as UserRole;
      }

      if (token.isAdmin !== undefined && session.user) {
        session.user.isAdmin = token.isAdmin as boolean;
      }

      return session;
    },
  }
});
