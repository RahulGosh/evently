"use server"

import { auth, signIn } from "@/auth";
import { db } from "@/lib/db";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { GetAllUsersParams, LoginSchema } from "@/types";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { RegisterSchema } from './../../types/index';
import { getUserByEmail } from "@/data/user";

export const login = async (values: z.infer<typeof LoginSchema>) => {
  const validatedFields = LoginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  const { email, password } = validatedFields.data;
  const existingUser = await getUserByEmail(email);

  if (!existingUser || !existingUser.email) {
    return { error: "Invalid credentials!" };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: DEFAULT_LOGIN_REDIRECT,
    });

    return { success: "Login successful!" }; // ✅ Return success message
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials!" };
        default:
          return { error: "Something went wrong!" };
      }
    }

    throw error;
  }
};

export const register = async (values: z.infer<typeof RegisterSchema>) => {
  const validateFields = RegisterSchema.safeParse(values);

  if (!validateFields.success) {
    return { error: "Invalid fields!" };
  }

  const { email, password, name } = validateFields.data;
  const hashedPassword = await bcrypt.hash(password, 10);

  const existingUser = await getUserByEmail(email)

  if (existingUser) {
    return { error: "Email already in use!" };
  }

  await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  return { success: "User created!" };
};

export const getAllUsers = async ({ searchString, role }: GetAllUsersParams) => {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return { error: "Unauthorized access. Please log in." };
    }

    const email = session.user.email;

    const loggedInUser = await db.user.findUnique({
      where: { email },
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
                  { name: { contains: searchString, mode: "insensitive" } },
                  { email: { contains: searchString, mode: "insensitive" } },
                ],
              }
            : {},
          role ? { role } : {}, // Filter by role if provided
        ],
      },
    });

    return { success: "Users fetched successfully.", users };
  } catch (error) {
    console.error("[GET_ALL_USERS_ERROR]", error);
    return { error: "An unexpected error occurred while fetching users." };
  }
};


export async function updateUserRole(userId: string, role: UserRole) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return { error: "Unauthorized. Please log in." };
    }

    // Type assertion: Ensuring email is a string
    const email = session.user.email as string;

    const loggedInUser = await db.user.findUnique({
      where: { email },
    });

    if (!loggedInUser || loggedInUser.role !== "ADMIN") {
      return { error: "Access denied. Only admins can change roles." };
    }

    if (!userId || !role) {
      return { error: "Missing required fields." };
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        role: role,
        isAdmin: role === "ADMIN",
      },
    });

    revalidatePath("/settings");
    return { success: "User role updated successfully.", user: updatedUser };
  } catch (error) {
    console.error("[USER_ROLE_UPDATE_ERROR]", error);
    return { error: "Something went wrong." };
  }
}