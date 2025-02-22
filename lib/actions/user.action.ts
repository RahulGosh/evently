"use server"

import { auth, signIn } from "@/auth";
import { db } from "@/lib/db";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { LoginSchema } from "@/types";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { RegisterSchema } from './../../types/index';

export const login = async (values: z.infer<typeof LoginSchema>) => {
  const validateFields = LoginSchema.safeParse(values);

  if (!validateFields.success) {
    return { error: "Invalid fields!" };
  }

  const { email, password } = validateFields.data;

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    return { success: "User logged in" };
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


export const getUserByEmail = async (email: string) => {
  try {
    const user = await db.user.findUnique({ where: { email } });

    return user;
  } catch (error) {
    return null;
  }
};

export const getUserById = async (id: string) => {
  try {
    const user = await db.user.findUnique({ where: { id } });
      console.log(id, "id")
    return user;
  } catch (error) {
    return null;
  }
};

export async function updateUserRole(userId: string, role: UserRole) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { error: "Unauthorized" };
    }

    if (!userId || !role) {
      return { error: "Missing required fields" };
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { 
        role: role,
        isAdmin: role === "ADMIN"
      },
    });

    revalidatePath("/settings");
    return { success: "Role updated successfully", user: updatedUser };
  } catch (error) {
    console.error("[USER_ROLE_UPDATE_ACTION]", error);
    return { error: "Something went wrong" };
  }
}