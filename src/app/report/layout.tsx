
"use client";

import { ReportTabs } from "@/components/report/ReportTabs";
import { AppHeader } from "@/components/app/header";
import { BarChart3 } from "lucide-react";

export default function ReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
            <h1 className="text-2xl md:text-3xl font-bold font-headline text-mint-500 flex items-center gap-3">
              <BarChart3 className="h-8 w-8" />
              Reports
            </h1>
            <ReportTabs />
            {children}
        </div>
      </main>
    </div>
  );
}
