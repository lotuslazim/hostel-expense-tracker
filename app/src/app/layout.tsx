import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/i18n/client-provider";
import { InventoryProvider } from "@/contexts/InventoryContext";
import './globals.css';
import { FirebaseClientProvider } from "@/firebase/client-provider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
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
