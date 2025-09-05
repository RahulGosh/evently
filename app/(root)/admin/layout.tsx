import { RoleGate } from "@/components/auth/roleGate";
import { currentAuthRole } from "@/lib/role";
import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { UserRole } from "@prisma/client";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
const role = await currentAuthRole()
console.log("ROLE CHECK:", role);
  return (
    <RoleGate allowedRole={UserRole.ADMIN} userRole={role}>
      {children}
    </RoleGate>
  );
}
