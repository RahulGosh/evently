import { HomeContent } from "@/components/shared/homeContent";
import { Suspense } from "react";

  export default async function Page(props: { searchParams: Promise<{ page?: string; query?: string; category?: string }> }) {
  const searchParams = await props.searchParams;

  const page = Number(searchParams?.page) || 1;
  const searchText = searchParams?.query ? String(searchParams.query) : "";
  const category = searchParams?.category ? String(searchParams.category) : "";

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent page={page} searchText={searchText} category={category} />
    </Suspense>
  );
}
