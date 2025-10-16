"use client";

import { ReportTabs } from "@/components/report/ReportTabs";
import { AppHeader } from "@/components/app/header";

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
            <h1 className="text-2xl md:text-3xl font-bold">Reports</h1>
            <ReportTabs />
            {children}
        </div>
      </main>
    </div>
  );
}
