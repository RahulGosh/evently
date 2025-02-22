"use client";

import { headerLinks } from "@/constants";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

const NavItems = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const pathname = usePathname();

  // Filter links: Show protected links only if the user is authenticated
  const filteredLinks = headerLinks.filter((link) => {
    if (!isAuthenticated && link.route.startsWith("/protected")) {
      return false; // Hide protected pages for unauthenticated users
    }
    return true;
  });

  return (
    <ul className="md:flex-between flex w-full flex-col items-start gap-5 md:flex-row">
      {filteredLinks.map((link) => {
        const isActive = pathname === link.route;

        return (
          <li
            key={link.route}
            className={`${
              isActive && "text-primary-500"
            } flex-center p-medium-16 whitespace-nowrap`}
          >
            <Link href={link.route}>{link.label}</Link>
          </li>
        );
      })}
    </ul>
  );
};

export default NavItems;
