
"use client";

import { Suspense } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { InventoryProvider } from "@/contexts/InventoryContext";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { I18nProvider } from "@/i18n/client-provider";
import { ReminderListener } from "@/components/app/ReminderListener";
import { ProgressBar } from "@/components/app/progress-bar";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <InventoryProvider>
          <FirebaseClientProvider>
            <Suspense fallback={null}>
              <ProgressBar />
            </Suspense>
            {children}
            <Toaster />
            <ReminderListener />
          </FirebaseClientProvider>
        </InventoryProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}
