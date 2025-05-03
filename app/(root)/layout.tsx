import Footer from "@/components/shared/footer";
import Header from "@/components/shared/header";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <div className="flex h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
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
      </div>
    </SessionProvider>
  );
}