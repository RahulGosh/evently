import bcrypt from "bcryptjs";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";
import { LoginSchema } from "./types/index";
import { getUserByEmail } from "./lib/actions/user.action";
import Github from "next-auth/providers/github";
import Google from "next-auth/providers/google";

export default {
  providers: [
    Github({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
      allowDangerousEmailAccountLinking: true, // ✅ Allows linking multiple providers to the same user
    }),
  Google({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true, // ✅ Allows linking multiple providers to the same user
    }),
    Credentials({
      async authorize(credentials) {
        const validatedFields = LoginSchema.safeParse(credentials);

        if (validatedFields.success) {
            const { email, password } = validatedFields.data;

            const user = await getUserByEmail(email);
            if (!user || !user.password) return null;

            const passwordMatches = await bcrypt.compare(
                password,
                user.password
            );

            if (passwordMatches) return user;
        }

        return null;
      },
    }),
  ],
} satisfies NextAuthConfig;
