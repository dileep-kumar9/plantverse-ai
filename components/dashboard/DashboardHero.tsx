"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { useDashboardData } from "@/components/dashboard/DashboardDataProvider";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardHero() {
  const { user } = useAuth();
  const { data, loading } = useDashboardData();
  const firstName = user?.name?.trim().split(/\s+/)[0] || "grower";
  const latest = data.analyses[0];
  const advice = latest?.wateringAdvice
    || latest?.prevention?.[0]
    || latest?.treatment?.[0]
    || "Run a Smart Scan to receive advice based on your own plant evidence.";

  return (
    <section className="dashboard-hero animate-fade-in" aria-labelledby="dashboard-heading">
      <div className="relative z-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div>
          <Badge>PlantVerse AI</Badge>
          <p className="mt-5 text-sm font-medium text-white/75">
            {greeting()}, {firstName}
          </p>
          <h1 id="dashboard-heading" className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Understand your plants, soil and growing space.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">
            Diagnose visible plant problems, inspect soil, plan growing spaces and keep your care records together.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="/scan" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-white bg-white px-5 py-3 text-base font-semibold text-green-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-green-50 hover:shadow-md sm:w-auto">
              Start Smart Scan <span aria-hidden="true">→</span>
            </Link>
            <Link href="/translator">
              <Button size="lg" variant="outline" className="w-full border-white/30 bg-white/10 text-white hover:border-white hover:bg-white/20 sm:w-auto">
                Open Translator
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4" aria-busy={loading}>
          <div className="hero-metric">
            <span className="text-sm text-white/65">Plants monitored</span>
            <strong className="mt-3 text-3xl font-semibold">{loading ? "—" : data.stats.plantCount}</strong>
            <span className="mt-2 text-xs text-emerald-100">Saved to your private account</span>
          </div>
          <div className="hero-metric">
            <span className="text-sm text-white/65">Garden health</span>
            <strong className="mt-3 text-3xl font-semibold">{loading ? "—" : `${data.stats.healthScore}%`}</strong>
            <span className="mt-2 text-xs text-emerald-100">Calculated from saved records</span>
          </div>
          <div className="hero-metric col-span-2">
            <span className="text-sm text-white/65">Latest care suggestion</span>
            <p className="mt-3 line-clamp-3 text-lg font-medium">{advice}</p>
            <span className="mt-3 text-xs text-white/65">
              {latest ? `Based on your latest ${latest.scanType || "plant"} analysis` : "No scan history yet"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
