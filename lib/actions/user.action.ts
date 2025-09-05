"use server";

import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth, clerkClient, currentUser, User } from "@clerk/nextjs/server";
import { GetAllUsersParams } from "@/types";
import { NextResponse } from "next/server";
import { request } from "http";

const getDisplayName = (user: User) => {
  if (user.fullName && user.fullName.trim() !== "") return user.fullName;
  if (user.username && user.username.trim() !== "") return user.username;
  if (user.firstName || user.lastName)
    return `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  return user.emailAddresses[0]?.emailAddress || "Unknown User";
};

export const getLoggedInUser = async () => {
  const user = await currentUser();
  if (!user) return null;

  const email = user.emailAddresses[0]?.emailAddress;
  const fullName = getDisplayName(user);

  const totalUsers = await db.user.count();
  const defaultRole: UserRole =
    totalUsers === 0 ? UserRole.ADMIN : UserRole.USER;

  const dbUser = await db.user.upsert({
    where: { email },
    update: {
      clerkId: user.id,
      fullName,
      image: user.imageUrl,
      role: defaultRole,
      isAdmin: defaultRole === "ADMIN",
    },
    create: {
      clerkId: user.id,
      email,
      fullName,
      image: user.imageUrl,
      role: defaultRole,
      isAdmin: defaultRole === "ADMIN",
    },
  });
  const client = await clerkClient();
  await client.users.updateUser(user.id, {
    publicMetadata: { role: dbUser.role },
  });

  return dbUser;
};

export const getAllClerkUsers = async (
  searchString?: string,
  role?: UserRole
) => {
  try {
    const client = await clerkClient();
    const paginatedUsers = await client.users.getUserList({ limit: 100 });

    let users = paginatedUsers.data;

    if (searchString) {
      const lowerSearch = searchString.toLowerCase();
      users = users.filter(
        (user) =>
          user.fullName?.toLowerCase().includes(lowerSearch) ||
          user.username?.toLowerCase().includes(lowerSearch) ||
          user.emailAddresses.some((e) =>
            e.emailAddress.toLowerCase().includes(lowerSearch)
          )
      );
    }

    if (role) {
      users = users.filter(
        (user) => (user.publicMetadata.role as UserRole) === role
      );
    }

    const formattedUsers = await Promise.all(
      users.map(async (user) => {
        const name = user.fullName || user.username || "Unknown";
        const email = user.emailAddresses[0]?.emailAddress || "Unknown";
        const userRole =
          (user.publicMetadata.role as UserRole) ?? UserRole.USER;

        const dbUser = await db.user.upsert({
          where: { email },
          update: {
            clerkId: user.id,
            fullName: name,
            image: user.imageUrl,
            // role: userRole,
            // isAdmin: userRole === "ADMIN",
          },
          create: {
            clerkId: user.id,
            email,
            fullName: name,
            image: user.imageUrl,
            role: UserRole.USER,
            isAdmin: userRole === "ADMIN",
          },
        });

        return {
          id: dbUser.id,
          clerkId: dbUser.clerkId,
          email: dbUser.email,
          emailVerified: dbUser.emailVerified,
          fullName: dbUser.fullName,
          image: dbUser.image,
          role: dbUser.role,
          isAdmin: dbUser.isAdmin,
        };
      })
    );

    return { success: true, users: formattedUsers };
  } catch (error) {
    console.error("[GET_ALL_CLERK_USERS_ERROR]", error);
    return { error: "Failed to fetch users from Clerk" };
  }
};

export const getAllUsers = async ({
  searchString,
  role,
}: GetAllUsersParams) => {
  const { userId } = await auth();

  if (!userId) {
    return { error: "Unauthorized. Please log in." };
  }

  const loggedInUser = await db.user.findUnique({
    where: { clerkId: userId },
  });

  if (!loggedInUser || loggedInUser.role !== "ADMIN") {
    return { error: "Access denied. Admin privileges required." };
  }

  const users = await db.user.findMany({
    where: {
      AND: [
        searchString
          ? {
              OR: [
                { fullName: { contains: searchString, mode: "insensitive" } },
                { email: { contains: searchString, mode: "insensitive" } },
              ],
            }
          : {},
        role ? { role } : {},
      ],
    },
  });

  return { success: "Users fetched successfully.", users };
};

export const updateUserRole = async (userId: string, role: UserRole) => {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return { error: "Unauthorized. Please log in." };
    }

    const loggedInUser = await db.user.findUnique({
      where: { clerkId: clerkUserId },
    });
    if (!loggedInUser || loggedInUser.role !== "ADMIN") {
      return { error: "Access denied. Only admins can change roles." };
    }

    if (!userId || !role) {
      return { error: "Missing required fields." };
    }

    // 1️⃣ Update role in your database
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        role,
        isAdmin: role === "ADMIN",
      },
    });

     const client = await clerkClient();

    await client.users.updateUser(updatedUser.clerkId, {
      publicMetadata: { role },
    });

    revalidatePath("/settings");
    return { success: "User role updated successfully.", user: updatedUser };
  } catch (error) {
    console.error("[USER_ROLE_UPDATE_ERROR]", error);
    return { error: "Something went wrong." };
  }
};

export const syncUser = async (clerkUserId: string) => {
  try {
    console.log("🔄 Syncing user:", clerkUserId);

    // Check if user already exists in our database
    const existingUser = await db.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (existingUser) {
      console.log("✅ User already exists in database:", existingUser.id);
      return existingUser;
    }

    // Fetch user details from Clerk
    let clerkUserData;
      const client = await clerkClient();
    try {
      const clerkUser = await client.users.getUser(clerkUserId);
      clerkUserData = {
        email: clerkUser.emailAddresses[0]?.emailAddress,
        fullName: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
        image: clerkUser.imageUrl,
      };
    } catch (error) {
      console.warn("Could not fetch user details from Clerk, creating minimal user record");
      clerkUserData = {
        email: `user-${clerkUserId}@temp.com`,
        fullName: 'User',
      };
    }

    // Create new user in our database
    const newUser = await db.user.create({
      data: {
        clerkId: clerkUserId,
        email: clerkUserData.email,
        fullName: clerkUserData.fullName,
        image: clerkUserData.image,
      },
    });

    console.log("✅ User created in database:", newUser.id);
    return newUser;

  } catch (error) {
    console.error("❌ Error syncing user:", error);
    throw new Error("Failed to sync user to database");
  }
};

export const getUserByClerkId = async (clerkId: string) => {
  return db.user.findUnique({
    where: { clerkId },
  });
};