import { currentRole } from "@/lib/auth";
import { RoleGate } from "@/components/auth/roleGate";
import { UserRole } from "@prisma/client";

export default async function AdminLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  // Get the user role on the server
  const role = await currentRole();
  
  return (
    <RoleGate 
      allowedRole={UserRole.ADMIN}
      userRole={role}
    >
      {children}
    </RoleGate> 
  );
}