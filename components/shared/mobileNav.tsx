"use client";

import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import Image from "next/image";
import { Separator } from "../ui/separator";
import NavItems from "./navItems";
import { useSession } from "next-auth/react";

const MobileNav = () => {
  const { data: session } = useSession();
  const isAuthenticated = !!session; // Check if the user is logged in

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
          <Image 
            src="/assets/images/logo.svg"
            alt="logo"
            width={128}
            height={38}
          />
          <Separator className="border border-gray-50" />
          {/* Pass isAuthenticated as a prop */}
          <NavItems isAuthenticated={!!session} isAdmin={session?.user?.role === "ADMIN"} />
          </SheetContent>
      </Sheet>
    </nav>
  );
};

export default MobileNav;
