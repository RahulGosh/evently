import { HomeContent } from "@/components/shared/homeContent";
import LoadingLogo from "@/components/shared/loadingLogo";
import { Suspense } from "react";
import { Toaster } from "react-hot-toast";

export default async function Page(props: { searchParams: Promise<{ page?: string; query?: string; category?: string }> }) {
  const searchParams = await props.searchParams;

  const page = Number(searchParams?.page) || 1;
  const searchText = searchParams?.query ? String(searchParams.query) : "";
  const category = searchParams?.category ? String(searchParams.category) : "";

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <LoadingLogo />
      </div>
    }>
       <Toaster 
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 4000,
              iconTheme: {
                primary: '#4f46e5',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
            },
          }}
        />
      <HomeContent page={page} searchText={searchText} category={category} />
    </Suspense>
  );
}