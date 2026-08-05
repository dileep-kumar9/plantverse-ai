"use client";

import { FormEvent, useState } from "react";
import { Trash2 } from "lucide-react";

import PageIntro from "@/components/shared/PageIntro";
import { useCollection } from "@/hooks/useCollection";
import type { Reminder } from "@/types/app";

export default function RemindersPage() {
  const { items, loading, error, create, update, remove } = useCollection<Reminder>("reminders");
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [plant, setPlant] = useState("");
  const [pushEnabled, setPushEnabled] = useState(true);
  const [busy, setBusy] = useState(false);

  async function add(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || !dueAt) return;
    setBusy(true);
    try {
      await create({
        title: title.trim(),
        dueAt: new Date(dueAt).toISOString(),
        done: false,
        plant: plant.trim(),
        pushEnabled,
        pushSentAt: null,
        createdAt: new Date().toISOString(),
      });
      setTitle("");
      setDueAt("");
      setPlant("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page-wrap">
      <PageIntro eyebrow="Plant calendar" title="Reminders" description="Cloud-synced tasks. Enabled reminders are mirrored into the secure scheduler and can trigger in-app and FCM push notifications." />
      <form onSubmit={add} className="dashboard-panel mt-8 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <input required value={title} onChange={(event) => setTitle(event.target.value)} className="rounded-2xl border p-3" placeholder="Reminder" />
        <input type="datetime-local" required value={dueAt} onChange={(event) => setDueAt(event.target.value)} className="rounded-2xl border p-3" />
        <button disabled={busy} className="voice-button">{busy ? "Adding…" : "Add"}</button>
        <input value={plant} onChange={(event) => setPlant(event.target.value)} className="rounded-2xl border p-3 sm:col-span-2" placeholder="Plant or growing area (optional)" />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pushEnabled} onChange={(event) => setPushEnabled(event.target.checked)} />Push when due</label>
      </form>
      {loading ? <div className="dashboard-panel mt-5">Loading reminders…</div> : null}
      {error ? <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div> : null}
      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="dashboard-panel flex items-center gap-4">
            <input type="checkbox" checked={item.done} onChange={() => void update(item.id, { done: !item.done })} className="h-5 w-5" />
            <div className="min-w-0 flex-1">
              <p className={item.done ? "font-semibold line-through opacity-60" : "font-semibold"}>{item.title}</p>
              <p className="text-sm text-[var(--text-secondary)]">{new Date(item.dueAt).toLocaleString()}{item.plant ? ` · ${item.plant}` : ""}</p>
              <p className="mt-1 text-xs text-[var(--text-tertiary)]">{item.pushEnabled === false ? "Push disabled" : item.pushSentAt ? "Notification sent" : "Push scheduled when enabled on a device"}</p>
            </div>
            <button type="button" onClick={() => void update(item.id, { pushEnabled: item.pushEnabled === false })} className="text-xs text-[var(--brand-primary)]">{item.pushEnabled === false ? "Enable push" : "Disable push"}</button>
            <button type="button" onClick={() => void remove(item.id)} className="text-red-500" aria-label="Delete reminder"><Trash2 size={18} /></button>
          </div>
        ))}
      </div>
    </main>
  );
}
