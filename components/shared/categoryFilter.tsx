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
    let newUrl = '';
  
    if (category && category !== 'All') {
      newUrl = formUrlQuery({
        params: searchParams.toString(),
        key: 'category',
        value: category
      });
    } else {
      // Remove 'category' from query
      newUrl = removeKeysFromQuery({
        params: searchParams.toString(),
        keysToRemove: ['category']
      });
  
      // If no query params are left, reset to base URL
      if (!newUrl || newUrl === '?') {
        newUrl = window.location.pathname;
      }
    }
  
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