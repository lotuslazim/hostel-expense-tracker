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
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
            <div className="text-center space-y-8 max-w-2xl mx-auto px-4">
              <div className="space-y-4">
                <h1 className="text-5xl font-bold text-gray-900 dark:text-gray-100">
                  Welcome to Your App
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-400">
                  Your Next.js application is ready to go!
                </p>
              </div>
              
              <div className="space-y-4">
                <Button asChild size="lg">
                  <Link href="/login">
                    Get Started
                  </Link>
                </Button>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  No more 404 errors! 🎉
                </div>
              </div>
            </div>
          </div>
          <Toaster />
        </InventoryProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}
