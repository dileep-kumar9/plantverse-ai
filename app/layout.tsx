import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AppShell from "@/components/layout/AppShell";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "PlantVerse AI", template: "%s | PlantVerse AI" },
  description: "AI plant, soil, land, device and gardening assistant.",
  applicationName: "PlantVerse AI",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}><body><AppShell>{children}</AppShell></body></html>;
}
