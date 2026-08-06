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

  const firstName =
    user?.name?.trim().split(/\s+/)[0] || "grower";

  const latest = data.analyses[0];

  const advice =
    latest?.wateringAdvice ||
    latest?.prevention?.[0] ||
    latest?.treatment?.[0] ||
    "Run a Smart Scan to receive advice based on your own plant evidence.";

  return (
    <section
      className="dashboard-hero min-h-0 !p-5 animate-fade-in sm:!p-7 lg:!p-10"
      aria-labelledby="dashboard-heading"
    >
      <div className="relative z-10 grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:gap-8">
        <div>
          <Badge>PlantVerse AI</Badge>

          <p className="mt-3 text-xs font-medium text-white/75 sm:mt-4 sm:text-sm">
            {greeting()}, {firstName}
          </p>

          <h1
            id="dashboard-heading"
            className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight text-white sm:mt-3 sm:text-4xl lg:text-5xl"
          >
            Understand your plants, soil and growing space.
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75 sm:mt-4 sm:text-base sm:leading-7">
            Diagnose plant problems, inspect soil, plan growing spaces and keep
            your care records together.
          </p>

          <div className="mt-5 grid gap-2 sm:flex sm:flex-wrap sm:gap-3">
            <Link
              href="/scan"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-white bg-white px-5 py-2.5 text-sm font-semibold text-green-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-green-50 hover:shadow-md sm:w-auto"
            >
              Start Smart Scan
              <span aria-hidden="true">→</span>
            </Link>

            <Link href="/translator" className="block sm:inline-block">
              <Button
                size="lg"
                variant="outline"
                className="min-h-11 w-full border-white/30 bg-white/10 px-5 py-2.5 text-sm text-white hover:border-white hover:bg-white/20 sm:w-auto"
              >
                Open Translator
              </Button>
            </Link>
          </div>
        </div>

        <div
          className="grid grid-cols-2 gap-2.5 sm:gap-3"
          aria-busy={loading}
        >
          <div className="hero-metric min-h-0 !p-4">
            <span className="text-xs text-white/65 sm:text-sm">
              Plants monitored
            </span>

            <strong className="mt-2 text-2xl font-semibold sm:text-3xl">
              {loading ? "—" : data.stats.plantCount}
            </strong>

            <span className="mt-1.5 text-[11px] leading-4 text-emerald-100 sm:text-xs">
              Saved privately
            </span>
          </div>

          <div className="hero-metric min-h-0 !p-4">
            <span className="text-xs text-white/65 sm:text-sm">
              Garden health
            </span>

            <strong className="mt-2 text-2xl font-semibold sm:text-3xl">
              {loading ? "—" : `${data.stats.healthScore}%`}
            </strong>

            <span className="mt-1.5 text-[11px] leading-4 text-emerald-100 sm:text-xs">
              From saved records
            </span>
          </div>

          <div className="hero-metric col-span-2 min-h-0 !p-4">
            <span className="text-xs text-white/65 sm:text-sm">
              Latest care suggestion
            </span>

            <p className="mt-2 line-clamp-2 text-sm font-medium leading-6 sm:text-base">
              {advice}
            </p>

            <span className="mt-2 text-[11px] leading-4 text-white/65 sm:text-xs">
              {latest
                ? `Based on your latest ${latest.scanType || "plant"} analysis`
                : "No scan history yet"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
