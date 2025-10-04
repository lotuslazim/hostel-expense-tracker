"use client";

import { AppHeader } from "@/components/app/header";
import { FirebaseClientProvider } from "@/firebase/client-provider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <div className="flex flex-col min-h-screen">
        <AppHeader />
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </FirebaseClientProvider>
  );
}