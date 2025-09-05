import { auth, currentUser } from "@clerk/nextjs/server";
import { UserRole } from "@prisma/client";

export async function currentAuthRole(): Promise<UserRole | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  if (!user) return null;

  return (user.publicMetadata.role as UserRole) ?? UserRole.USER;
}
