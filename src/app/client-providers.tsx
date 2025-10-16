
"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { InventoryProvider } from "@/contexts/InventoryContext";
import { I18nProvider } from "@/i18n/client-provider";
import { ReminderListener } from "@/components/app/ReminderListener";
import { FirebaseClientProvider } from "@/firebase/client-provider";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <I18nProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <InventoryProvider>
            {children}
            <Toaster />
            <ReminderListener />
          </InventoryProvider>
        </ThemeProvider>
      </I18nProvider>
    </FirebaseClientProvider>
  );
}
