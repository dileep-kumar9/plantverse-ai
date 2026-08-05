"use client";

import { FormEvent, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import PageIntro from "@/components/shared/PageIntro";
import { useCollection } from "@/hooks/useCollection";
import type { Plant } from "@/types/app";

export default function PlantsPage() {
  const { items: plants, loading, error, create, remove } = useCollection<Plant>("plants");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", localName: "", scientificName: "", place: "", health: 100, icon: "🪴", notes: "" });

  async function addPlant(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.place.trim()) return;
    setBusy(true);
    try {
      await create({
        ...form,
        name: form.name.trim(),
        localName: form.localName.trim(),
        scientificName: form.scientificName.trim(),
        place: form.place.trim(),
        health: Math.max(0, Math.min(100, Number(form.health))),
        createdAt: new Date().toISOString(),
      });
      setForm({ name: "", localName: "", scientificName: "", place: "", health: 100, icon: "🪴", notes: "" });
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page-wrap">
      <PageIntro
        eyebrow="Your garden"
        title="My Plants"
        description="A private profile for every plant, including health, notes, scans, and growing location."
        action={<button type="button" onClick={() => setOpen((value) => !value)} className="voice-button"><Plus size={17} /> Add plant</button>}
      />

      {open ? (
        <form onSubmit={addPlant} className="dashboard-panel mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">Plant name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-2 w-full rounded-2xl border p-3" /></label>
          <label className="text-sm font-medium">Local name<input value={form.localName} onChange={(e) => setForm({ ...form, localName: e.target.value })} className="mt-2 w-full rounded-2xl border p-3" /></label>
          <label className="text-sm font-medium">Scientific name<input value={form.scientificName} onChange={(e) => setForm({ ...form, scientificName: e.target.value })} className="mt-2 w-full rounded-2xl border p-3" /></label>
          <label className="text-sm font-medium">Growing location<input required value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })} className="mt-2 w-full rounded-2xl border p-3" placeholder="Terrace, field, pot…" /></label>
          <label className="text-sm font-medium">Health score: {form.health}%<input type="range" min="0" max="100" value={form.health} onChange={(e) => setForm({ ...form, health: Number(e.target.value) })} className="mt-3 w-full" /></label>
          <label className="text-sm font-medium">Icon<input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value.slice(0, 4) })} className="mt-2 w-full rounded-2xl border p-3" /></label>
          <label className="text-sm font-medium sm:col-span-2">Notes<textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="mt-2 w-full rounded-2xl border p-3" /></label>
          <div className="flex gap-3 sm:col-span-2"><button disabled={busy} className="voice-button">{busy ? "Saving…" : "Save plant"}</button><button type="button" onClick={() => setOpen(false)} className="outline-button">Cancel</button></div>
        </form>
      ) : null}

      {loading ? <div className="dashboard-panel mt-8">Loading plants…</div> : null}
      {error ? <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div> : null}
      {!loading && !error && !plants.length ? <div className="dashboard-panel mt-8 text-center"><div className="text-5xl">🪴</div><h2 className="mt-4 text-xl font-semibold">Add your first plant</h2><p className="mt-2 text-[var(--text-secondary)]">Your plant list will sync privately across devices.</p></div> : null}

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {plants.map((plant) => (
          <article key={plant.id} className="feature-card relative">
            <button type="button" onClick={() => window.confirm("Delete this plant?") && void remove(plant.id)} className="absolute right-4 top-4 text-red-500" aria-label={`Delete ${plant.name}`}><Trash2 size={17} /></button>
            <div className="text-5xl">{plant.icon || "🪴"}</div>
            <h2 className="mt-5 text-xl font-semibold">{plant.localName || plant.name}</h2>
            <p className="text-sm text-[var(--text-secondary)]">{plant.name} · {plant.place}</p>
            {plant.scientificName ? <p className="mt-1 text-xs italic text-[var(--text-tertiary)]">{plant.scientificName}</p> : null}
            <div className="mt-5 h-2 rounded-full bg-[var(--surface-secondary)]"><div className="h-full rounded-full bg-[var(--brand-primary)]" style={{ width: `${plant.health}%` }} /></div>
            <p className="mt-2 text-sm font-semibold text-[var(--brand-primary)]">Health {plant.health}%</p>
            {plant.notes ? <p className="mt-3 line-clamp-3 text-sm text-[var(--text-secondary)]">{plant.notes}</p> : null}
          </article>
        ))}
      </div>
    </main>
  );
}
