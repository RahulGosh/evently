import NextAuth, { DefaultSession } from "next-auth";
import authConfig from "./auth.config";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { db } from "./lib/db";
import { getUserById, getUserByEmail } from "./lib/actions/user.action";
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
    async signIn({ user, account, profile }) {
      console.log("🔄 Checking account linking for:", user.email);
    
      if (!user.email || !account) return false;
    
      // Ensure provider account is linked to an existing user
      const existingUser = await getUserByEmail(user.email);
    
      if (existingUser) {
        console.log("✅ User exists, linking account:", account.provider);
    
        // Force-link external account to the same user
        await db.account.upsert({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
          update: {}, // No update needed if it already exists
          create: {
            userId: existingUser.id, // Link to existing user
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            type: account.type,
            access_token: account.access_token || null,
            refresh_token: account.refresh_token || null,
            expires_at: account.expires_at || null,
            id_token: account.id_token || null,
          },
        });
    
        return true; // Continue with sign-in
      }
    
      // If user doesn't exist, allow new user creation
      return true;
    },

    async jwt({ token, user }) {
      console.log("🔄 Checking user linking:", user);

      if (!token.sub) return token;

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
  },
});
