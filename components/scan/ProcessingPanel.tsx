"use client";

import { Check, LoaderCircle, ScanSearch } from "lucide-react";
import { useEffect, useState } from "react";

const stages = [
  "Validating evidence quality",
  "Identifying the scene and subject",
  "Checking visible symptoms and risks",
  "Generating practical recommendations",
];

export default function ProcessingPanel({ analysisName }: { analysisName: string }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setActive((value) => Math.min(value + 1, stages.length - 1)), 1250);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="mt-6 overflow-hidden rounded-3xl border border-[var(--border-color)] bg-[var(--surface-primary)]">
      <div className="bg-gradient-to-br from-green-950 to-green-700 p-6 text-white sm:p-8">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/12"><ScanSearch size={28} /></span>
          <div><p className="text-sm text-white/65">PlantVerse AI inspection</p><h3 className="mt-1 text-2xl font-semibold">Analyzing {analysisName.toLowerCase()}</h3></div>
        </div>
        <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-white transition-all duration-700" style={{ width: `${Math.max(18, ((active + 1) / stages.length) * 100)}%` }} /></div>
      </div>
      <ol className="space-y-3 p-5 sm:p-6">
        {stages.map((stage, index) => {
          const completed = index < active;
          const current = index === active;
          return <li key={stage} className="flex items-center gap-3 rounded-2xl bg-[var(--surface-secondary)] p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-primary)] text-[var(--brand-primary)]">{completed ? <Check size={18} /> : current ? <LoaderCircle size={18} className="animate-spin" /> : index + 1}</span>
            <span className={completed || current ? "font-medium" : "text-[var(--text-secondary)]"}>{stage}</span>
          </li>;
        })}
      </ol>
    </section>
  );
}
