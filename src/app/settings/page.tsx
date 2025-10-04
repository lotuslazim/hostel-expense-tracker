"use client";

import { AppHeader } from "@/components/app/header";
import { Settings } from "@/components/settings/Settings";

export default function SettingsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Settings />
      </main>
    </div>
  );
}
