"use client";

import type { AnalysisResult, SavedAnalysis } from "@/types/analysis";
import { readStore, writeStore } from "@/lib/local-store";

function List({ title, values }: { title: string; values: string[] }) {
  if (!values?.length) return null;
  return <section className="rounded-3xl border border-[var(--border-color)] bg-[var(--surface-primary)] p-5"><h3 className="font-semibold">{title}</h3><ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--text-secondary)]">{values.map((value) => <li key={value} className="flex gap-2"><span className="text-[var(--brand-primary)]">✓</span><span>{value}</span></li>)}</ul></section>;
}

export default function AnalysisResult({ result, scanType, imageName, onReset }: { result: AnalysisResult; scanType: string; imageName?: string; onReset: () => void }) {
  function save() {
    const existing = readStore<SavedAnalysis[]>("plantverse-analyses", []);
    const item: SavedAnalysis = { ...result, id: crypto.randomUUID(), scanType, imageName, createdAt: new Date().toISOString() };
    writeStore("plantverse-analyses", [item, ...existing]);
    alert("Saved to Plant Memory");
  }

  function printReport() { window.print(); }

  return <section className="mt-8 animate-fade-in">
    <div className="rounded-[2rem] bg-gradient-to-br from-green-900 to-green-600 p-6 text-white sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div><p className="text-sm text-white/70">AI analysis report</p><h2 className="mt-2 text-3xl font-semibold">{result.plantName || "Visual analysis"}</h2><p className="mt-1 italic text-white/70">{result.scientificName}</p></div>
        <div className="grid grid-cols-2 gap-3"><div className="hero-metric min-h-24"><span className="text-xs text-white/70">Health</span><strong className="mt-2 text-2xl">{Math.round(result.healthScore)}%</strong></div><div className="hero-metric min-h-24"><span className="text-xs text-white/70">Confidence</span><strong className="mt-2 text-2xl">{Math.round(result.confidence)}%</strong></div></div>
      </div>
      <div className="mt-6 rounded-2xl bg-white/10 p-4"><p className="text-sm text-white/70">Finding</p><p className="mt-1 text-xl font-medium">{result.disease || "No specific disease identified"}</p><p className="mt-1 text-sm capitalize text-white/70">Severity: {result.severity}</p></div>
    </div>

    <div className="mt-6 grid gap-5 lg:grid-cols-2">
      <List title="Visible symptoms" values={result.symptoms} />
      <List title="Possible causes" values={result.possibleCauses} />
      <List title="Recommended next steps" values={result.treatment} />
      <List title="Prevention" values={result.prevention} />
      <List title="More evidence requested" values={result.evidenceNeeded} />
    </div>

    <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">{result.disclaimer || "AI guidance should be confirmed by a local horticulture or agriculture professional for serious or worsening problems."}</div>
    <div className="mt-6 flex flex-wrap gap-3"><button onClick={save} className="voice-button">Save to Plant Memory</button><button onClick={printReport} className="outline-button">Print / Save PDF</button><button onClick={onReset} className="outline-button">New scan</button></div>
  </section>;
}
