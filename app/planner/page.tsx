"use client";

import { useState } from "react";
import PageIntro from "@/components/shared/PageIntro";

const options = {
  Pot: ["Tomato", "Chilli", "Mint", "Tulsi"],
  Terrace: ["Tomato", "Okra", "Brinjal", "Leafy greens"],
  Field: ["Groundnut", "Maize", "Paddy", "Vegetables"],
  "Empty land": ["Fruit trees", "Native shade trees", "Vegetable beds", "Pollinator garden"],
} as const;

type Space = keyof typeof options;
const spaces = Object.keys(options) as Space[];
const icons = ["🌿", "🌳", "🥬", "🌼"];

export default function PlannerPage() {
  const [space, setSpace] = useState<Space>("Terrace");

  return (
    <main className="page-wrap">
      <PageIntro eyebrow="Growing-space modes" title="Grow Planner" description="Compare starter layouts for pots, terraces, fields and open land. Confirm choices with local sunlight, water, dimensions and soil evidence." />
      <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Growing space">
        {spaces.map((item) => <button key={item} type="button" onClick={() => setSpace(item)} className={space === item ? "voice-button" : "outline-button"}>{item}</button>)}
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <section className="dashboard-panel min-h-96 bg-[linear-gradient(135deg,#d9f5df,#eef7e9)] text-gray-900">
          <p className="text-sm font-semibold text-green-700">Illustrative layout preview</p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {options[space].map((item, index) => <div key={item} className="flex min-h-28 items-center justify-center rounded-3xl border-2 border-dashed border-green-600/30 bg-white/60 p-3 text-center font-medium">{icons[index] || "🌱"} {item}</div>)}
          </div>
        </section>
        <section className="dashboard-panel">
          <p className="eyebrow">Starter ideas for {space}</p>
          <h2 className="mt-2 text-2xl font-semibold">Suggested growing plan</h2>
          <ul className="mt-5 space-y-3">{options[space].map((item) => <li key={item} className="rounded-2xl bg-[var(--surface-secondary)] p-4">✓ {item}</li>)}</ul>
          <p className="mt-5 text-sm text-[var(--text-secondary)]">These are general examples, not a site-specific crop prescription. Run a land or soil scan and provide sunlight, water availability, dimensions and local season before making purchases.</p>
        </section>
      </div>
    </main>
  );
}
