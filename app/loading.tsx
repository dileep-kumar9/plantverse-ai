export default function Loading() {
  return <main className="page-wrap"><div className="dashboard-panel" role="status" aria-live="polite"><div className="h-5 w-32 animate-pulse rounded bg-[var(--surface-secondary)]" /><div className="mt-5 h-10 w-2/3 animate-pulse rounded bg-[var(--surface-secondary)]" /><div className="mt-4 h-24 animate-pulse rounded-2xl bg-[var(--surface-secondary)]" /><span className="sr-only">Loading PlantVerse…</span></div></main>;
}
