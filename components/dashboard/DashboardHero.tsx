import Link from "next/link";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export default function DashboardHero() {
  return (
    <section className="dashboard-hero animate-fade-in">
      <div className="relative z-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div>
          <Badge>PlantVerse AI</Badge>

          <p className="mt-5 text-sm font-medium text-white/75">
            Good evening, Dileep
          </p>

          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Understand your plants, soil and growing space.
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">
            Diagnose plant problems, inspect soil, plan empty land, connect
            moisture meters and speak naturally with your AI gardening
            assistant.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
  href="/scan"
  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-white bg-white px-5 py-3 text-base font-semibold text-green-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-green-50 hover:shadow-md sm:w-auto"
>
  Start Smart Scan
  <span aria-hidden="true">→</span>
</Link>

            <Link href="/translator">
              <Button
                size="lg"
                variant="outline"
                className="w-full border-white/30 bg-white/10 text-white hover:border-white hover:bg-white/20 sm:w-auto"
              >
                Open Translator
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="hero-metric">
            <span className="text-sm text-white/65">Plants monitored</span>
            <strong className="mt-3 text-3xl font-semibold">24</strong>
            <span className="mt-2 text-xs text-emerald-100">
              3 added this month
            </span>
          </div>

          <div className="hero-metric">
            <span className="text-sm text-white/65">Garden health</span>
            <strong className="mt-3 text-3xl font-semibold">89%</strong>
            <span className="mt-2 text-xs text-emerald-100">
              Improving steadily
            </span>
          </div>

          <div className="hero-metric col-span-2">
            <span className="text-sm text-white/65">Plant AI advice</span>

            <p className="mt-3 text-lg font-medium">
              Rain may arrive tomorrow. Check soil moisture before watering.
            </p>

            <span className="mt-3 text-xs text-white/65">
              Based on your recent tomato scans
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}