
import type { Metadata } from "next";
import { Poppins, Playfair_Display } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ClientProviders } from "./client-providers";
import { Suspense } from "react";
import { ProgressBar } from "@/components/app/progress-bar";
import AppDock from "@/components/app/AppDock";
import { headers } from 'next/headers';

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-poppins",
  display: 'swap',
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-playfair-display",
  display: 'swap',
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
  const pathname = headers().get('x-next-pathname') || '/';
  const publicRoutes = ['/', '/about', '/contact', '/login', '/signup'];
  const isPublicRoute = publicRoutes.includes(pathname);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
          "font-body", 
          !isPublicRoute && "pb-24", 
          poppins.variable, 
          playfairDisplay.variable
        )} suppressHydrationWarning>
        <Suspense fallback={null}>
          <ProgressBar />
        </Suspense>
        <ClientProviders>
          {children}
          <AppDock />
        </ClientProviders>
      </body>
    </html>
  );
}
