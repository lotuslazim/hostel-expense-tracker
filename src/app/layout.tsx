import type { Metadata, Viewport } from "next";
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

  applicationName: "BachelorBite",
  manifest: "/manifest.webmanifest",

  icons: {
    icon: [
      {
        url: "/logo1.png",
        type: "image/png",
        sizes: "2048x2048",
      },
    ],
    apple: [
      {
        url: "/logo1.png",
        type: "image/png",
        sizes: "2048x2048",
      },
    ],
  },

  appleWebApp: {
    capable: true,
    title: "BachelorBite",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f4b43c",
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
