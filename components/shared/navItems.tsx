"use client";

import { headerLinks } from "@/constants";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

interface NavItemsProps {
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const NavItems = ({ isAuthenticated, isAdmin }: NavItemsProps) => {
  const pathname = usePathname();
  
  // Filter links based on authentication and admin status
  const filteredLinks = headerLinks.filter((link) => {
    // Home is always visible to everyone
    if (link.route === "/") {
      return true;
    }
    
    // Profile is only visible to logged-in users (both regular and admin)
    if (link.route === "/protected/profile") {
      return isAuthenticated;
    }
    
    // Create Event is only visible to admins
    if (link.route === "/protected/admin/events/create") {
      return isAuthenticated && isAdmin;
    }
    
    return false;
  });
  
  console.log("Auth Status:", { isAuthenticated, isAdmin });
  console.log("Filtered Links:", filteredLinks);

  return (
    <ul className="flex w-full flex-col items-center justify-center gap-8 md:flex-row md:justify-center md:gap-8">
      {filteredLinks.map((link) => {
        const isActive = pathname === link.route;

        return (
          <li
            key={link.route}
            className={`${
              isActive ? "text-primary-500" : ""
            } flex-center p-medium-16 whitespace-nowrap px-4`}
          >
            <Link href={link.route}>{link.label}</Link>
          </li>
        );
      })}
    </ul>
  );
};

export default NavItems;