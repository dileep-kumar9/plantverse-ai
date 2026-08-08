"use client";

import Link from "next/link";
import { useDashboardData } from "@/components/dashboard/DashboardDataProvider";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

function statusFor(health: number) {
  if (health >= 80) return { label: "Healthy", className: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300" };
  if (health >= 60) return { label: "Monitor", className: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" };
  return { label: "Needs attention", className: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300" };
}

export default function RecentPlants() {
  const { data, loading, error } = useDashboardData();

  return (
    <section className="mt-10" aria-labelledby="recent-plants-title" aria-busy={loading}>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <Badge>Recent plants</Badge>
          <h2 id="recent-plants-title" className="mt-3 text-2xl font-semibold tracking-tight">Recently saved plants</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Continue monitoring your own plant collection.</p>
        </div>
        <Link href="/plants" className="shrink-0 text-sm font-semibold text-[var(--brand-primary)] hover:underline">View all</Link>
      </div>

      {error ? <Card><p className="text-sm text-red-600">Unable to load saved plants.</p></Card> : null}
      {!loading && !error && data.plants.length === 0 ? (
        <Card className="text-center">
          <p className="font-semibold">Your plant collection is empty</p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Add a plant to start tracking health and care notes.</p>
          <Link href="/plants" className="mt-4 inline-flex text-sm font-semibold text-[var(--brand-primary)] hover:underline">Add a plant</Link>
        </Card>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {data.plants.slice(0, 3).map((plant) => {
          const status = statusFor(Number(plant.health) || 0);
          return (
            <Link key={plant.id} href="/plants" className="rounded-[var(--radius-lg)] tap-scale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]">
              <Card interactive className="h-full">
                <div className="flex items-start gap-4">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[var(--brand-soft)] text-2xl" aria-hidden="true">{plant.icon || "🌿"}</div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold">{plant.name}</h3>
                    <p className="mt-1 truncate text-xs italic text-[var(--text-tertiary)]">{plant.scientificName || plant.place || "Saved plant"}</p>
                    <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>{status.label}</span>
                  </div>
                </div>
                <p className="mt-5 text-xs text-[var(--text-tertiary)]">Health score: {Math.max(0, Math.min(100, Number(plant.health) || 0))}%</p>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
