"use client";

import { AppHeader } from "@/components/app/header";
import { ReportTabs } from "@/components/report/ReportTabs";

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
          <ReportTabs />
          {children}
        </div>
      </main>
    </div>
  );
}
