import { UserRole } from "@prisma/client";
import { type DefaultSession } from "next-auth";


export type ExtendedUser = DefaultSession["user"] & {
  // address: string;
  // image?: string | null;
  // emailVerified?: Date | null;
  isAdmin: boolean; // Add isAdmin property
  role: UserRole;
};

declare module "next-auth" {
  interface Session {
    user: ExtendedUser;
  }
}

// import { JWT } from "next-auth/jwt"

// declare module "next-auth/jwt" {
//   /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
//   interface JWT {
//     /** OpenID ID Token */
//     role?: "ADMIN" | "USER"
//   }
// }
