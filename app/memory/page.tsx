"use client";

import { Eye, HeartPulse, Sparkles, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import PageIntro from "@/components/shared/PageIntro";
import { useCollection } from "@/hooks/useCollection";
import type { SavedAnalysis } from "@/types/analysis";

export default function MemoryPage() {
  const router = useRouter();
  const { items, loading, error, remove } = useCollection<SavedAnalysis>("analyses");
  const [clearing, setClearing] = useState(false);

  async function clearHistory() {
    if (!window.confirm("Delete all saved reports? This cannot be undone.")) return;
    setClearing(true);
    try {
      for (const item of items) await remove(item.id);
    } finally {
      setClearing(false);
    }
  }

  return (
    <main className="page-wrap">
      <PageIntro
        eyebrow="Long-term intelligence"
        title="Plant Memory"
        description="Private cloud-synced AI reports form a health timeline across your devices."
        action={
          items.length ? (
            <button type="button" onClick={() => void clearHistory()} disabled={clearing} className="outline-button text-red-600 disabled:opacity-60">
              <Trash2 size={17} /> {clearing ? "Clearing…" : "Clear history"}
            </button>
          ) : undefined
        }
      />

      {loading ? <div className="dashboard-panel mt-8">Loading saved reports…</div> : null}
      {error ? <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div> : null}
      {!loading && !error && items.length === 0 ? (
        <div className="dashboard-panel mt-8 text-center">
          <div className="text-5xl">🧠</div>
          <h2 className="mt-4 text-xl font-semibold">No saved reports yet</h2>
          <p className="mt-2 text-[var(--text-secondary)]">Run Smart Scan and choose Save to Memory.</p>
        </div>
      ) : null}

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {items.map((item) => (
          <article key={item.id} className="dashboard-panel">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="eyebrow">{item.scanType.replaceAll("-", " ")} analysis</p>
                <h2 className="mt-2 text-2xl font-semibold">{item.plantName || "Unknown plant"}</h2>
                {item.localName ? <p className="mt-1 text-xl font-medium text-[var(--brand-primary)]">{item.localName}</p> : null}
                {item.scientificName ? (
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    <span className="font-semibold not-italic">Scientific name:</span>{" "}
                    <span className="italic">{item.scientificName}</span>
                  </p>
                ) : null}
              </div>
              <div className="rounded-full bg-[var(--brand-soft)] px-3 py-1.5 text-sm font-semibold text-[var(--brand-primary)]">
                {Math.round(Number(item.healthScore) || 0)}% health
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-[var(--surface-secondary)] p-4">
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"><HeartPulse size={17} />Condition</div>
                <p className="mt-2 font-semibold">{item.disease || "Healthy"}</p>
              </div>
              <div className="rounded-2xl bg-[var(--surface-secondary)] p-4">
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"><Sparkles size={17} />AI confidence</div>
                <p className="mt-2 font-semibold">{Math.round(Number(item.confidence) || 0)}%</p>
              </div>
            </div>

            <p className="mt-4 text-sm text-[var(--text-secondary)]">Saved {new Date(item.createdAt).toLocaleString()}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" onClick={() => router.push(`/scan?report=${encodeURIComponent(item.id)}`)} className="voice-button">
                <Eye size={17} /> View report
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Delete this report?")) void remove(item.id);
                }}
                className="outline-button text-red-600"
              >
                <Trash2 size={17} /> Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
