import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { InventoryProvider } from "@/contexts/InventoryContext";
import "./globals.css";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { I18nProvider } from "@/i18n/client-provider";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className} suppressHydrationWarning>
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
              </FirebaseClientProvider>
            </InventoryProvider>
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
