import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import AnalyticsConsent from "@/components/analytics/AnalyticsConsent";
import { AuthProvider } from "@/components/auth/AuthProvider";
import AppShell from "@/components/layout/AppShell";
import PwaRegistration from "@/components/pwa/PwaRegistration";
import { allowSearchIndexing, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const allowIndexing = allowSearchIndexing();
const googleVerification = process.env.GOOGLE_SITE_VERIFICATION?.trim();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "PlantVerse AI — Plant health, soil guidance and grow planning",
    template: "%s | PlantVerse AI",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  manifest: "/manifest.webmanifest",
  robots: {
    index: allowIndexing,
    follow: allowIndexing,
    googleBot: {
      index: allowIndexing,
      follow: allowIndexing,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: "PlantVerse AI — Plant health, soil guidance and grow planning",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" }],
  },
  appleWebApp: {
    capable: true,
    title: "PlantVerse",
    statusBarStyle: "default",
  },
  verification: googleVerification ? { google: googleVerification } : undefined,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
          <PwaRegistration />
        </AuthProvider>
      </body>
    </html>
  );
}
