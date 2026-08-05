"use client";

import { useDashboardData } from "@/components/dashboard/DashboardDataProvider";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

export default function GardenHealth() {
  const { data, loading, error } = useDashboardData();
  const healthScore = data.stats.healthScore;
  const label = healthScore >= 80 ? "Healthy" : healthScore >= 60 ? "Monitor" : healthScore > 0 ? "Needs attention" : "No data";
  const stats = [
    { value: data.stats.plantCount, label: "Plants", tone: "text-green-600 dark:text-green-400" },
    { value: data.stats.needAttention, label: "Need attention", tone: "text-amber-600 dark:text-amber-400" },
    { value: data.stats.scansThisWeek, label: "Scans this week", tone: "text-blue-600 dark:text-blue-400" },
  ];

  return (
    <Card className="h-full" aria-busy={loading}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Badge tone="success">Garden health</Badge>
          <div className="mt-4 flex items-end gap-2">
            <h2 className="text-4xl font-semibold tracking-tight">{loading ? "—" : `${healthScore}%`}</h2>
            <span className="pb-1 text-sm font-medium text-green-600 dark:text-green-400">{label}</span>
          </div>
          <p className="mt-2 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
            {error
              ? "Garden data could not be loaded right now."
              : data.stats.plantCount || data.analyses.length
                ? `${data.stats.needAttention} saved plant${data.stats.needAttention === 1 ? "" : "s"} currently need closer attention.`
                : "Save plants or scan results to build your garden health summary."}
          </p>
        </div>
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[var(--brand-soft)] text-2xl" aria-hidden="true">🌿</span>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between gap-4 text-xs font-medium text-[var(--text-secondary)]">
          <span>Overall condition</span><span>{healthScore}/100</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-[var(--surface-secondary)]" role="progressbar" aria-label="Overall garden health" aria-valuemin={0} aria-valuemax={100} aria-valuenow={healthScore}>
          <div className="h-full rounded-full bg-[var(--brand-primary)] transition-[width] duration-500" style={{ width: `${Math.max(0, Math.min(100, healthScore))}%` }} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="min-w-0 rounded-2xl border border-[var(--border-color)] bg-[var(--surface-secondary)] px-3 py-4 text-center sm:px-4">
            <p className={`text-2xl font-semibold ${stat.tone}`}>{loading ? "—" : stat.value}</p>
            <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{stat.label}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
