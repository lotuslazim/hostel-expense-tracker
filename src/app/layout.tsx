
import type { Metadata } from "next";
import { PT_Sans, Playfair_Display } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { InventoryProvider } from "@/contexts/InventoryContext";
import "./globals.css";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { I18nProvider } from "@/i18n/client-provider";
import { cn } from "@/lib/utils";
import { ReminderListener } from "@/components/app/ReminderListener";

const ptSans = PT_Sans({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-pt-sans",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-playfair-display",
});


export const metadata: Metadata = {
  title: "NourishTrack",
  description: "Simplified meal and expense tracking.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("font-body", ptSans.variable, playfairDisplay.variable)} suppressHydrationWarning>
        <I18nProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <InventoryProvider>
              <FirebaseClientProvider>
                {children}
                <Toaster />
                <ReminderListener />
              </FirebaseClientProvider>
            </InventoryProvider>
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
