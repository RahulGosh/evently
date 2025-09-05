import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "./db";

export async function currentAuth() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  return user;
}

export async function getUserByClerkId(clerkId: string) {
  try {
    const user = await db.user.findUnique({
      where: { clerkId },
      select: { id: true }
    });
    
    return user;
  } catch (error) {
    console.error("Error fetching user by Clerk ID:", error);
    throw error;
  }
}