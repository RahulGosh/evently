"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserRole } from "@prisma/client";

interface RoleGateProps {
  children: React.ReactNode;
  allowedRole: UserRole;
  userRole?: UserRole | null;
}

export const RoleGate = ({ 
  children, 
  allowedRole,
  userRole
}: RoleGateProps) => {
  const router = useRouter();

  useEffect(() => {
    if (!userRole) {
      router.push("/auth/login");
    } else if (userRole !== allowedRole) {
      router.push("/");
    }
  }, [allowedRole, router, userRole]);

  // If no role or incorrect role, don't render children
  if (!userRole || userRole !== allowedRole) {
    return null;
  }

  return <>{children}</>;
};