import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import AnalyticsConsent from "@/components/analytics/AnalyticsConsent";
import { AuthProvider } from "@/components/auth/AuthProvider";
import AppShell from "@/components/layout/AppShell";

import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const allowIndexing = process.env.ALLOW_INDEXING === "true";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: { default: "PlantVerse AI", template: "%s | PlantVerse AI" },
  description: "AI-assisted plant, soil, land, device and gardening workspace with private cloud records.",
  applicationName: "PlantVerse AI",
  manifest: "/manifest.webmanifest",
  robots: { index: allowIndexing, follow: allowIndexing },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f8f3" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1510" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <AuthProvider>
          <AppShell>{children}</AppShell>
          <AnalyticsConsent />
        </AuthProvider>
      </body>
    </html>
  );
}
