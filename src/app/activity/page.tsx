"use client";

import { AppHeader } from "@/components/app/header";
import { ActivityLog } from "@/components/activity/ActivityLog";

export default function ActivityPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="container mx-auto flex-grow px-4 py-8 sm:px-6 lg:px-8">
        <ActivityLog />
      </main>
    </div>
  );
}
