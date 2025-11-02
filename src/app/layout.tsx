
import type { Metadata } from "next";
import { Poppins, Playfair_Display, Righteous } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ClientProviders } from "./client-providers";
import { Suspense } from "react";
import { ProgressBar } from "@/components/app/progress-bar";

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

const righteous = Righteous({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-righteous",
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
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("font-body", poppins.variable, playfairDisplay.variable, righteous.variable)} suppressHydrationWarning>
        <Suspense fallback={null}>
          <ProgressBar />
        </Suspense>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
