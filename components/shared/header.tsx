"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "../ui/button";
import NavItems from "./navItems";
import MobileNav from "./mobileNav";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { Loader2 } from "lucide-react"; // Import a loader icon from Lucide

const Header = () => {
  const { data: session } = useSession(); // Get session data
  const [loading, setLoading] = useState(false); // Track logout state

  const handleLogout = async () => {
    setLoading(true);
    await signOut({ callbackUrl: "/login" });
    setLoading(false);
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

        <nav className="md:flex-between hidden w-full max-w-xs">
          <NavItems isAuthenticated={!!session} />
        </nav>

        <div className="flex w-32 justify-end gap-3">
          <MobileNav />

          {session ? (
            <Button
              className="rounded-full flex items-center gap-2"
              size="lg"
              onClick={handleLogout}
              disabled={loading} // Disable button while logging out
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Logout"}
            </Button>
          ) : (
            <>
              <Button asChild className="rounded-full" size="lg">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild className="rounded-full" size="lg">
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
