"use client";

import { useState } from "react";

import PageIntro from "@/components/shared/PageIntro";
import { useCollection } from "@/hooks/useCollection";
import { apiFetch } from "@/lib/client-api";
import type { Order, OrderStatus, ShippingAddress } from "@/types/app";

const steps: OrderStatus[] = ["paid", "processing", "shipment_pending", "shipped", "out_for_delivery", "delivered"];

function statusLabel(status: OrderStatus) {
  return status.replaceAll("_", " ");
}

function addressLabel(address: ShippingAddress | string): string {
  if (typeof address === "string") return address;
  return [address.addressLine1, address.addressLine2, address.city, address.state, address.postalCode]
    .filter(Boolean)
    .join(", ");
}

export default function OrdersPageClient({ checkoutStatus }: { checkoutStatus?: string }) {
  const { items: orders, loading, error } = useCollection<Order>("orders");
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function track(order: Order) {
    setTrackingId(order.id);
    setMessage("");
    try {
      const response = await apiFetch<{ message?: string }>(
        `/api/orders/${encodeURIComponent(order.id)}/tracking`,
      );
      setMessage(response.message ?? "Tracking was synchronized. Refreshing orders…");
      window.setTimeout(() => window.location.reload(), 700);
    } catch (requestError) {
      setMessage(requestError instanceof Error ? requestError.message : "Unable to synchronize tracking.");
    } finally {
      setTrackingId(null);
    }
  }

  return (
    <main className="page-wrap">
      <PageIntro eyebrow="Billing and delivery" title="Orders & Tracking" description="Stripe-confirmed payments and Shiprocket delivery updates from your private account." />
      {checkoutStatus === "success" ? <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800">Payment was submitted. The order changes to paid only after the signed Stripe webhook confirms it.</div> : null}
      {message ? <div className="mt-6 rounded-2xl bg-[var(--brand-soft)] p-4 text-sm">{message}</div> : null}
      {loading ? <div className="dashboard-panel mt-8">Loading orders…</div> : null}
      {error ? <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div> : null}
      {!loading && !orders.length ? <div className="dashboard-panel mt-8">No orders yet.</div> : null}
      <div className="mt-8 space-y-5">
        {orders.map((order) => {
          const stepIndex = steps.indexOf(order.status);
          return (
            <article key={order.id} className="dashboard-panel">
              <div className="flex flex-wrap justify-between gap-4">
                <div>
                  <p className="eyebrow">{order.orderNumber || order.id}</p>
                  <h2 className="mt-2 text-xl font-semibold">₹{order.total.toLocaleString("en-IN")}</h2>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{addressLabel(order.address)}</p>
                  <p className="mt-1 text-xs text-[var(--text-tertiary)]">Placed {new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <span className="health-pill capitalize">{statusLabel(order.status)}</span>
              </div>
              <div className="mt-5 space-y-2 text-sm">{order.items.map((item) => <p key={item.id}>{item.quantity} × {item.name}</p>)}</div>
              {stepIndex >= 0 ? (
                <div className="mt-7 grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {steps.map((step, index) => (
                    <div key={step}>
                      <div className={`h-2 rounded-full ${index <= stepIndex ? "bg-[var(--brand-primary)]" : "bg-[var(--surface-secondary)]"}`} />
                      <p className="mt-2 text-xs capitalize">{statusLabel(step)}</p>
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="mt-5 flex flex-wrap gap-2">
                {order.awbCode ? <button type="button" disabled={trackingId === order.id} onClick={() => void track(order)} className="outline-button">{trackingId === order.id ? "Syncing…" : "Sync tracking"}</button> : null}
                {order.trackingUrl ? <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="outline-button">Open courier tracking</a> : null}
                {order.refundId ? <span className="text-xs text-[var(--text-secondary)]">Refund reference: {order.refundId}</span> : null}
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
