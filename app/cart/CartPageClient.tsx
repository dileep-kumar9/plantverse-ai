"use client";

import { useState } from "react";

import PageIntro from "@/components/shared/PageIntro";
import { useCollection } from "@/hooks/useCollection";
import { apiFetch } from "@/lib/client-api";
import type { CartItem, ShippingAddress } from "@/types/app";

const emptyAddress: ShippingAddress = {
  name: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "IN",
};

export default function CartPageClient({ checkoutStatus }: { checkoutStatus?: string }) {
  const commerceEnabled = process.env.NEXT_PUBLIC_COMMERCE_ENABLED === "true";
  const { items, loading, error, update, remove } = useCollection<CartItem>("cart");
  const [address, setAddress] = useState<ShippingAddress>(emptyAddress);
  const [busy, setBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  function field<K extends keyof ShippingAddress>(key: K, value: ShippingAddress[K]) {
    setAddress((current) => ({ ...current, [key]: value }));
  }

  async function checkout() {
    if (!items.length) return setCheckoutError("Your cart is empty.");
    setBusy(true);
    setCheckoutError("");
    try {
      const response = await apiFetch<{ url: string }>("/api/checkout", {
        method: "POST",
        body: JSON.stringify({
          items: items.map((item) => ({ id: item.id, quantity: item.quantity })),
          address,
        }),
      });
      window.location.assign(response.url);
    } catch (requestError) {
      setCheckoutError(requestError instanceof Error ? requestError.message : "Unable to start checkout.");
      setBusy(false);
    }
  }

  return (
    <main className="page-wrap">
      <PageIntro
        eyebrow="Buying and billing"
        title="Cart & Secure Checkout"
        description={
          commerceEnabled
            ? "The server rechecks Firestore prices and atomically reserves inventory. Stripe hosts the payment page; PlantVerse never receives card details."
            : "Checkout is disabled until the operator enables verified catalogue, payment and fulfilment services."
        }
      />
      {checkoutStatus === "cancelled" ? <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">Checkout was cancelled. Reserved stock will be released automatically and your cart remains available.</div> : null}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_.8fr]">
        <section className="dashboard-panel">
          {loading ? <p>Loading cart…</p> : null}
          {error ? <p className="text-red-600">{error}</p> : null}
          {!loading && !items.length ? <p>Your cart is empty.</p> : null}
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 border-b border-[var(--border-color)] py-4 last:border-b-0">
              <span className="text-3xl">{item.icon}</span>
              <div className="min-w-0 flex-1"><p className="font-semibold">{item.name}</p><p>₹{item.price.toLocaleString("en-IN")}</p></div>
              <input type="number" min="1" max="10" value={item.quantity} onChange={(event) => void update(item.id, { quantity: Math.max(1, Math.min(10, Number(event.target.value))) })} className="w-20 rounded-xl border p-2" aria-label={`Quantity for ${item.name}`} />
              <button type="button" onClick={() => void remove(item.id)} className="text-sm text-red-600">Remove</button>
            </div>
          ))}
        </section>

        <section className="dashboard-panel h-fit">
          <h2 className="text-xl font-semibold">Delivery and order summary</h2>
          <p className="mt-4 text-3xl font-semibold">₹{total.toLocaleString("en-IN")}</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">Displayed cart total is an estimate. The server validates the current catalogue price and stock before Stripe opens.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <input required value={address.name} onChange={(event) => field("name", event.target.value)} className="rounded-2xl border p-3 sm:col-span-2" placeholder="Recipient name" />
            <input required inputMode="tel" value={address.phone} onChange={(event) => field("phone", event.target.value)} className="rounded-2xl border p-3 sm:col-span-2" placeholder="Indian mobile number" />
            <input required value={address.addressLine1} onChange={(event) => field("addressLine1", event.target.value)} className="rounded-2xl border p-3 sm:col-span-2" placeholder="House, street and area" />
            <input value={address.addressLine2} onChange={(event) => field("addressLine2", event.target.value)} className="rounded-2xl border p-3 sm:col-span-2" placeholder="Landmark (optional)" />
            <input required value={address.city} onChange={(event) => field("city", event.target.value)} className="rounded-2xl border p-3" placeholder="City" />
            <input required value={address.state} onChange={(event) => field("state", event.target.value)} className="rounded-2xl border p-3" placeholder="State" />
            <input required inputMode="numeric" maxLength={6} value={address.postalCode} onChange={(event) => field("postalCode", event.target.value)} className="rounded-2xl border p-3 sm:col-span-2" placeholder="6-digit PIN code" />
          </div>
          {checkoutError ? <p className="mt-3 text-sm text-red-600">{checkoutError}</p> : null}
          <button className="voice-button mt-4 w-full" disabled={busy || !items.length || !commerceEnabled} onClick={() => void checkout()}>
            {busy ? "Reserving stock…" : commerceEnabled ? "Pay securely with Stripe" : "Checkout unavailable"}
          </button>
        </section>
      </div>
    </main>
  );
}
