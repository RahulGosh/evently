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
import {
  useUser,
  SignInButton,
  SignUpButton,
  SignOutButton,
} from "@clerk/nextjs";
import { Button } from "../ui/button";
import Link from "next/link";

const MobileNav = () => {
  const { user, isSignedIn } = useUser();

  const isAdmin = user?.publicMetadata?.role === "ADMIN";
  const isEmployer = user?.publicMetadata?.role === "EMPLOYER";

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
            isAuthenticated={!!isSignedIn}
            isAdmin={!!isAdmin}
            isEmployer={!!isEmployer}
          />

          <div className="mt-auto">
            <Separator className="border border-gray-50 mb-4" />

            {isSignedIn ? (
              // ✅ Logout Button
              <SignOutButton>
                <Button
                  className="w-full rounded-full flex items-center justify-center gap-2"
                  size="lg"
                >
                  Logout
                </Button>
              </SignOutButton>
            ) : (
              // ✅ Login & Register Buttons
              <div className="flex flex-col gap-3">
                <SignInButton mode="modal">
                  <Button className="w-full rounded-full" size="lg">
                    Login
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button className="w-full rounded-full" size="lg">
                    Register
                  </Button>
                </SignUpButton>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
};

export default MobileNav;
