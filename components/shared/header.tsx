"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "../ui/button";
import MobileNav from "./mobileNav";
import NavItems from "./navItems";
import { useRouter } from "next/navigation";
import { useUser, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

const Header = () => {
  const { user, isSignedIn } = useUser();
  const router = useRouter();

  const navigateToUpdateRole = () => {
    if (user?.publicMetadata?.role === "ADMIN") {
      router.push("/protected/profile/updateRole");
    }
  };

  return (
    <header className="w-full border-b">
      <div className="wrapper flex items-center justify-between">
        <Link href="/" className="w-36">
          <Image
            src="/assets/images/logo.svg"
            width={128}
            height={38}
            alt="Evently logo"
          />
        </Link>

        <nav className="hidden w-full md:flex justify-center">
          <NavItems
            isAuthenticated={!!isSignedIn}
            isAdmin={user?.publicMetadata?.role === "ADMIN"}
            isEmployer={user?.publicMetadata?.role === "EMPLOYER"}
          />
        </nav>

        {/* Mobile Menu and Profile - Right side */}
        <div className="flex items-center gap-3">
          <div className="md:hidden">
            <MobileNav />
          </div>

          <SignedIn>
            <div className="flex items-center gap-3">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9 border border-gray-300 rounded-full",
                  },
                }}
              />
            </div>
          </SignedIn>

          <SignedOut>
            <Button asChild className="rounded-full hidden md:inline-flex" size="lg">
              <Link href="/sign-in">Login</Link>
            </Button>
            <Button asChild className="rounded-full hidden md:inline-flex" size="lg">
              <Link href="/sign-up">Register</Link>
            </Button>
          </SignedOut>
        </div>
      </div>
    </header>
  );
};

export default Header;
