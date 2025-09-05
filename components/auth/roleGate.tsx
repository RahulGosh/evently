"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserRole } from "@prisma/client";
import { useAuth } from "@clerk/nextjs";

interface RoleGateProps {
  children: React.ReactNode;
  allowedRole: UserRole;
  userRole?: UserRole | null; // coming from server
}

export const RoleGate = ({ 
  children, 
  allowedRole,
  userRole
}: RoleGateProps) => {
  const router = useRouter();
  const { isLoaded, userId } = useAuth();

  useEffect(() => {
    if (!isLoaded) return; 

    if (!userId) {
      router.push("/sign-in");
    } else if (!userRole || userRole !== allowedRole) {
      router.push("/");
    }
  }, [allowedRole, router, userRole, userId, isLoaded]);

  if (!isLoaded || !userId || !userRole || userRole !== allowedRole) {
    return null;
  }

  return <>{children}</>;
};
