"use server"

import { db } from "../db";

// Create a new category
export const createCategory = async (name: string) => {
  try {
    const category = await db.category.create({
      data: {
        name,
      },
    });
    return { success: true, data: category };
  } catch (error) {
    return { success: false, error: "Failed to create category" };
  }
};

// Get all categories
export const getAllCategories = async () => {
  try {
    const categories = await db.category.findMany();
    return { success: true, data: categories };
  } catch (error) {
    return { success: false, error: "Failed to fetch categories" };
  }
};
