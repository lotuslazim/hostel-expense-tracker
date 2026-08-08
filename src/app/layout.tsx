import type { Metadata } from "next";
import {
  Playfair_Display,
  Poppins,
} from "next/font/google";

import "./globals.css";
import "./app-shell.css";

import { cn } from "@/lib/utils";
import { ClientProviders } from "./client-providers";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-playfair-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BachelorBite",
  description:
    "Simplified meal and expense tracking for shared living.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="dark"
      style={{ colorScheme: "dark" }}
      suppressHydrationWarning
    >
      <body
        className={cn(
          "font-body",
          poppins.variable,
          playfairDisplay.variable
        )}
        suppressHydrationWarning
      >
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
