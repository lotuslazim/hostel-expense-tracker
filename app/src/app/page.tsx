"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/i18n/client-provider";
import { InventoryProvider } from "@/contexts/InventoryContext";
import './globals.css';

export default function Home() {
  return (
    <I18nProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <InventoryProvider>
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center space-y-8 max-w-2xl mx-auto px-4">
              <div className="space-y-4">
                <h1 className="text-5xl font-bold text-foreground">
                  Welcome to NourishTrack
                </h1>
                <p className="text-xl text-muted-foreground">
                  Your journey to simplified meal and expense tracking starts here.
                </p>
              </div>
              
              <div className="space-y-4">
                <Button asChild size="lg">
                  <Link href="/login">
                    Get Started
                  </Link>
                </Button>
              </div>
            </div>
          </div>
          <Toaster />
        </InventoryProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}
