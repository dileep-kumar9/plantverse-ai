"use client";

import { useState } from "react";
import Link from "next/link";
import { useDashboardData } from "@/components/dashboard/DashboardDataProvider";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

function formatDue(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No due date";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default function TaskList() {
  const { data, loading, error, toggleReminder } = useDashboardData();
  const [updating, setUpdating] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function toggle(id: string) {
    const reminder = data.reminders.find((item) => item.id === id);
    if (!reminder || updating) return;
    setUpdating(id);
    setActionError(null);
    try {
      await toggleReminder(reminder);
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : "Unable to update reminder.");
    } finally {
      setUpdating(null);
    }
  }

  return (
    <Card className="h-full" aria-busy={loading}>
      <div className="flex items-center justify-between gap-3">
        <Badge>Upcoming tasks</Badge>
        <Link href="/reminders" className="text-sm font-semibold text-[var(--brand-primary)] hover:underline">View all</Link>
      </div>
      {error || actionError ? <p className="mt-4 text-sm text-red-600">{actionError || "Unable to load reminders."}</p> : null}
      {!loading && !error && data.reminders.length === 0 ? (
        <div className="mt-6 animate-fade-in rounded-2xl border border-dashed border-[var(--border-color)] p-5 text-center">
          <p className="font-medium">No upcoming tasks</p>
          <Link href="/reminders" className="mt-2 inline-flex text-sm font-semibold text-[var(--brand-primary)] hover:underline">Create a reminder</Link>
        </div>
      ) : null}
      <div className="mt-6 space-y-4">
        {loading
          ? [0, 1, 2].map((i) => <div key={i} className="skeleton h-[4.25rem] rounded-2xl" />)
          : data.reminders.slice(0, 3).map((task) => (
            <div key={task.id} className="tap-scale flex items-center justify-between gap-4 rounded-2xl border border-[var(--border-color)] p-4 transition-colors duration-150 hover:bg-[var(--surface-secondary)]">
              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                <input type="checkbox" checked={task.done} disabled={updating === task.id} onChange={() => void toggle(task.id)} className="h-5 w-5 accent-[var(--brand-primary)]" />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{task.title}</span>
                  <span className="block text-sm text-[var(--text-secondary)]">{formatDue(task.dueAt)}</span>
                </span>
              </label>
              {updating === task.id ? <span className="text-xs text-[var(--text-tertiary)]">Saving…</span> : null}
            </div>
          ))}
      </div>
    </Card>
  );
}
