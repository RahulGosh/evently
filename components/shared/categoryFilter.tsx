"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getAllCategories } from "@/lib/actions/category.action";
import { formUrlQuery, removeKeysFromQuery } from "@/lib/utils";
import { Category } from "@prisma/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const CategoryFilter = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const getCategories = async () => {
      const categoryList = await getAllCategories();
  
      if (categoryList.success && categoryList.data) {
        setCategories(categoryList.data); // No need for type assertion
      } else {
        console.error("Failed to fetch categories:", categoryList.error);
      }
    };
  
    getCategories();
  }, []);

  const onSelectCategory = (category: string) => {
    let currentParams = new URLSearchParams(searchParams.toString());
  
    if (category && category !== "All") {
      currentParams.set("category", category);
      currentParams.delete("page"); // Ensure we reset to page 1 when selecting a category
    } else {
      currentParams.delete("category");
      currentParams.delete("page"); // Also remove page when resetting category
    }
  
    // Construct the new URL without adding unwanted encoded characters
    const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
  
    router.push(newUrl, { scroll: false });
  };
  
  return (
    <Select onValueChange={(value: string) => onSelectCategory(value)}>
      <SelectTrigger className="select-field">
        <SelectValue placeholder="Category" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="All" className="select-item p-regular-14">All</SelectItem>

        {categories.map((category) => (
          <SelectItem value={category.name} key={category.id} className="select-item p-regular-14">
            {category.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export default CategoryFilter