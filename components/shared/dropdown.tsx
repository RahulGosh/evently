import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { startTransition, useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "../ui/input";
import { createCategory, getAllCategories } from "@/lib/actions/category.action";
import { Category } from "@prisma/client";

type DropdownProps = {
  value?: string;
  onChangeHandler?: (value: string) => void;
};

const Dropdown = ({ value, onChangeHandler }: DropdownProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      const response = await getAllCategories();
      if (response.success && response.data) {
        setCategories(response.data);
      } else {
        setCategories([]); // Ensure it's always an array
      }
    };
    fetchCategories();
  }, []);

  // Handle new category creation
  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
  
    const response = await createCategory(newCategory);
    if (response.success && response.data) {
      setCategories((prev) => [...prev, response.data]); // Add new category
      setNewCategory(""); // Clear input field
    } else {
      console.error("Failed to add category:", response.error);
    }
  };

  return (
    <Select onValueChange={onChangeHandler} defaultValue={value}>
      <SelectTrigger className="select-field">
        <SelectValue placeholder="Category" />
      </SelectTrigger>
      <SelectContent>
        {categories.length > 0 &&
          categories.map((category) => (
            <SelectItem
              key={category.id}
              value={category.id}
              className="select-item p-regular-14"
            >
              {category.name}
            </SelectItem>
          ))}

        {/* Add New Category Option */}
        <AlertDialog>
          <AlertDialogTrigger className="p-medium-14 flex w-full rounded-sm py-3 pl-8 text-primary-500 hover:bg-primary-50 focus:text-primary-500">
            Add new category
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-white">
            <AlertDialogHeader>
              <AlertDialogTitle>New Category</AlertDialogTitle>
              <AlertDialogDescription>
                <Input
                  type="text"
                  placeholder="Category name"
                  className="input-field mt-3"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                />
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => startTransition(handleAddCategory)}>
                Add
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SelectContent>
    </Select>
  );
};

export default Dropdown;
