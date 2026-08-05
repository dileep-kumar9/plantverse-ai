"use client";

import PushNotificationManager from "@/components/notifications/PushNotificationManager";
import PageIntro from "@/components/shared/PageIntro";
import { useCollection } from "@/hooks/useCollection";
import type { InAppNotification } from "@/types/app";

export default function NotificationsPage() {
  const { items, loading, error, update, remove } =
    useCollection<InAppNotification>("notifications");

  return (
    <main className="page-wrap">
      <PageIntro
        eyebrow="Care, order and delivery updates"
        title="Notifications"
        description="In-app notifications are cloud-synced. Browser push is opt-in and registered independently on each device."
      />
      <div className="mt-8"><PushNotificationManager /></div>
      <section className="mt-8" aria-labelledby="notification-list-title">
        <div className="flex items-center justify-between gap-4">
          <h2 id="notification-list-title" className="text-2xl font-semibold">In-app notifications</h2>
          <span className="text-sm text-[var(--text-secondary)]">{items.filter((item) => !item.read).length} unread</span>
        </div>
        {loading ? <div className="dashboard-panel mt-4">Loading notifications…</div> : null}
        {error ? <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div> : null}
        {!loading && items.length === 0 ? <div className="dashboard-panel mt-4">No notifications yet.</div> : null}
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <article key={item.id} className={`dashboard-panel flex gap-4 ${item.read ? "opacity-70" : ""}`}>
              <span className="text-2xl" aria-hidden="true">
                {item.type === "reminder" ? "⏰" : item.type === "shipment" ? "🚚" : item.type === "order" ? "📦" : item.type === "community" ? "👨‍🌾" : "🔔"}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{item.body}</p>
                <p className="mt-2 text-xs text-[var(--text-tertiary)]">{new Date(item.createdAt).toLocaleString()}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-sm">
                  {!item.read ? <button type="button" onClick={() => void update(item.id, { read: true })} className="text-[var(--brand-primary)]">Mark read</button> : null}
                  {item.href ? <a href={item.href} className="text-[var(--brand-primary)]">Open</a> : null}
                  <button type="button" onClick={() => void remove(item.id)} className="text-red-600">Delete</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
