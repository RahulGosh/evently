"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "../ui/button";
import NavItems from "./navItems";
import MobileNav from "./mobileNav";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

const Header = () => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setLoading(true);
    await signOut();
  };

  const navigateToUpdateRole = () => {
    if (session?.user?.role === "ADMIN") {
      router.push("/protected/profile/updateRole");
    }
  };

  return (
    <header className="w-full border-b">
      <div className="wrapper flex items-center justify-between">
        {/* Logo - Left side */}
        <Link href="/" className="w-36">
          <Image
            src="/assets/images/logo.svg"
            width={128}
            height={38}
            alt="Evently logo"
          />
        </Link>

        {/* Desktop Navigation - Center */}
        <nav className="hidden w-full md:flex justify-center">
          <NavItems
            isAuthenticated={!!session}
            isAdmin={session?.user?.role === "ADMIN"}
            isEmployer={session?.user?.role === "EMPLOYER"}
          />
        </nav>

        {/* Mobile Menu and Profile - Right side */}
        <div className="flex items-center gap-3">
          {/* Show mobile nav hamburger on mobile */}
          <div className="md:hidden">
            <MobileNav />
          </div>

          {session ? (
            <div className="flex items-center gap-3">
              {/* Profile Image */}
              {session.user?.image ? (
                <Image
                  src={session.user.image}
                  onClick={navigateToUpdateRole}
                  width={36}
                  height={36}
                  alt="User Profile"
                  className={`rounded-full border border-gray-300 cursor-pointer ${
                    session?.user?.role !== "ADMIN" ? "cursor-default" : ""
                  }`}
                />
              ) : (
                <Image
                  src="/assets/images/defaultUser.png"
                  width={36}
                  height={36}
                  alt="Default Profile"
                  className={`rounded-full border border-gray-300 cursor-pointer ${
                    session?.user?.role !== "ADMIN" ? "cursor-default" : ""
                  }`}
                  onClick={navigateToUpdateRole}
                />
              )}

              {/* Logout Button - Hidden on mobile */}
              <Button
                className="rounded-full flex items-center gap-2 hidden md:flex"
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
            </div>
          ) : (
            <>
              <Button asChild className="rounded-full hidden md:inline-flex" size="lg">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild className="rounded-full hidden md:inline-flex" size="lg">
                <Link href="/register">Register</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;