import { HomeContent } from "@/components/shared/homeContent";
import { SearchParamProps } from "@/types";
import { Suspense } from "react";

export default function Home({ searchParams }: SearchParamProps) {
  const page = Number(searchParams?.page) || 1;
  const searchText = searchParams?.query ? String(searchParams.query) : "";
  const category = searchParams?.category ? String(searchParams.category) : "";

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent page={page} searchText={searchText} category={category} />
    </Suspense>
  );
}
