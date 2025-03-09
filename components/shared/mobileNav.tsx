"use client";

import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import Image from "next/image";
import { Separator } from "../ui/separator";
import NavItems from "./navItems";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";
import Link from "next/link";

const MobileNav = () => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    await signOut();
  };

  return (
    <nav className="md:hidden">
      <Sheet>
        <SheetTrigger className="align-middle">
          <Image 
            src="/assets/icons/menu.svg"
            alt="menu"
            width={24}
            height={24}
            className="cursor-pointer"
          />
        </SheetTrigger>
        <SheetContent className="flex flex-col gap-6 bg-white md:hidden">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>

          {/* Logo */}
          <Image 
            src="/assets/images/logo.svg"
            alt="logo"
            width={128}
            height={38}
          />
          <Separator className="border border-gray-50" />

          {/* Navigation Items */}
          <NavItems 
            isAuthenticated={!!session} 
            isAdmin={session?.user?.role === "ADMIN"} 
          />

          <div className="mt-auto">
            <Separator className="border border-gray-50 mb-4" />

            {session ? (
              /* Logout Button */
              <Button
                className="w-full rounded-full flex items-center justify-center gap-2"
                size="lg"
                onClick={handleLogout}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  "Logout"
                )}
              </Button>
            ) : (
              /* Login & Register Buttons */
              <div className="flex flex-col gap-3">
                <Button asChild className="w-full rounded-full" size="lg">
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild className="w-full rounded-full" size="lg">
                  <Link href="/register">Register</Link>
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
};

export default MobileNav;
