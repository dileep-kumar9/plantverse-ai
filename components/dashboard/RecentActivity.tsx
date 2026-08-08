"use client";

import Link from "next/link";
import { useDashboardData } from "@/components/dashboard/DashboardDataProvider";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

function relativeTime(value: string) {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return "Recently";
  const seconds = Math.max(0, Math.round((Date.now() - time) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Yesterday" : `${days} days ago`;
}

export default function RecentActivity() {
  const { data, loading, error } = useDashboardData();

  return (
    <Card className="h-full" aria-busy={loading}>
      <div>
        <Badge>Recent activity</Badge>
        <h2 className="mt-4 text-xl font-semibold tracking-tight">Latest scan reports</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Your most recent AI analyses.</p>
      </div>

      {error ? <p className="mt-6 text-sm text-red-600">Unable to load recent activity.</p> : null}
      {!loading && !error && data.analyses.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-[var(--border-color)] p-5 text-center">
          <p className="font-medium">No saved reports yet</p>
          <Link href="/scan" className="mt-2 inline-flex text-sm font-semibold text-[var(--brand-primary)] hover:underline">Start your first scan</Link>
        </div>
      ) : null}

      <ol className="mt-6 divide-y divide-[var(--border-color)]">
        {loading
          ? [0, 1, 2].map((i) => (
            <li key={i} className="py-4 first:pt-0 last:pb-0">
              <div className="skeleton h-12 rounded-2xl" />
            </li>
          ))
          : data.analyses.slice(0, 3).map((item) => (
            <li key={item.id} className="py-4 first:pt-0 last:pb-0">
              <Link href={`/scan?report=${encodeURIComponent(item.id)}`} className="tap-scale flex gap-4 rounded-xl p-2 -m-2 transition-colors duration-150 hover:bg-[var(--surface-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--brand-soft)] text-2xl" aria-hidden="true">📷</div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <p className="truncate font-semibold">{item.plantName || `${item.scanType} analysis`}</p>
                    <time dateTime={item.createdAt} className="shrink-0 text-xs text-[var(--text-tertiary)]">{relativeTime(item.createdAt)}</time>
                  </div>
                  <p className="mt-1 truncate text-sm text-[var(--text-secondary)]">{item.disease || `Health score ${item.healthScore}%`}</p>
                </div>
              </Link>
            </li>
          ))}
      </ol>
    </Card>
  );
}
