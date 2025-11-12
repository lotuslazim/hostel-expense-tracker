
"use client";

import { AppHeader } from "@/components/app/header";
import { SettlementHistory } from "@/components/settlements/SettlementHistory";
import { Scale } from "lucide-react";

export default function SettlementsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold font-headline text-header-yellow flex items-center gap-3">
                    <Scale className="h-8 w-8" />
                    Settlement History
                </h1>
                <p className="text-sm md:text-base text-muted-foreground">A permanent record of all past monthly settlements.</p>
            </div>
            <SettlementHistory />
        </div>
      </main>
    </div>
  );
}
