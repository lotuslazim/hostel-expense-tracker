
import type { Metadata } from "next";
import { Playfair_Display, Poppins } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { InventoryProvider } from "@/contexts/InventoryContext";
import "./globals.css";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { I18nProvider } from "@/i18n/client-provider";
import { cn } from "@/lib/utils";
import { ReminderListener } from "@/components/app/ReminderListener";
import { ProgressBar } from "@/components/app/progress-bar";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-poppins",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-playfair-display",
});


export const metadata: Metadata = {
  title: "BachelorBite",
  description: "Simplified meal and expense tracking for shared living.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("font-body", poppins.variable, playfairDisplay.variable)} suppressHydrationWarning>
        <I18nProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <InventoryProvider>
              <FirebaseClientProvider>
                <ProgressBar />
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
