"use client";

import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";

export function ClearFiltersButton() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const clearFilter = () => {
    const params = new URLSearchParams(searchParams.toString());

    // Remove specific query parameters
    params.delete("searchText");
    params.delete("category");
    params.delete("page");

    // Update the URL without reloading
    router.push(`?${params.toString()}`);
  };

  return (
    <Button variant="outline" onClick={clearFilter} className="whitespace-nowrap">
      Clear Filters
    </Button>
  );
}
