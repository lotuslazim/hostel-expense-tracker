"use client";

import { ReportTabs } from "@/components/report/ReportTabs";

export default function ReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <ReportTabs />
      {children}
    </div>
  );
}
