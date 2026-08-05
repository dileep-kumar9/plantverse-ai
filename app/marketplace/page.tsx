"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import PageIntro from "@/components/shared/PageIntro";
import { useCollection } from "@/hooks/useCollection";
import type { CartItem, Product } from "@/types/app";

export default function MarketplacePage() {
  const commerceEnabled = process.env.NEXT_PUBLIC_COMMERCE_ENABLED === "true";
  const { items: cart, create, update } = useCollection<CartItem>("cart");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    void fetch("/api/products", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as { items?: Product[]; error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Unable to load catalogue.");
        if (active) setProducts(payload.items ?? []);
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "Unable to load catalogue.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const categories = useMemo(
    () => ["All", ...new Set(products.map((item) => item.category).filter(Boolean))],
    [products],
  );
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return products.filter((product) => {
      const categoryMatch = category === "All" || product.category === category;
      const queryMatch =
        !normalized ||
        `${product.name} ${product.description} ${product.category} ${product.tag ?? ""}`
          .toLowerCase()
          .includes(normalized);
      return categoryMatch && queryMatch;
    });
  }, [category, products, query]);

  async function add(product: Product) {
    setMessage("");
    if (product.stock < 1) return setMessage(`${product.name} is currently out of stock.`);
    const found = cart.find((item) => item.id === product.id);
    if (found) {
      await update(found.id, { quantity: Math.min(Math.min(10, product.stock), found.quantity + 1) });
    } else {
      await create({
        id: product.id,
        sku: product.sku,
        name: product.name,
        price: product.price,
        quantity: 1,
        icon: product.icon ?? "🌿",
        category: product.category,
        tag: product.tag,
        createdAt: new Date().toISOString(),
      });
    }
    setMessage(`${product.name} added to your cart.`);
  }

  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  return (
    <main className="page-wrap">
      <PageIntro
        eyebrow="Verified catalogue and stock"
        title="Marketplace"
        description={
          commerceEnabled
            ? "Products, prices and available stock come from the Firestore merchant catalogue and are validated again in an atomic checkout transaction."
            : "Catalogue browsing is available, but checkout remains disabled until the operator enables verified inventory, Stripe and fulfilment."
        }
        action={<Link className="voice-button" href="/cart">Cart {count}</Link>}
      />

      <section className="mt-7 flex flex-col gap-3 rounded-3xl border border-[var(--border-color)] bg-[var(--surface-primary)] p-4 sm:flex-row">
        <input value={query} onChange={(event) => setQuery(event.target.value)} className="min-h-12 min-w-0 flex-1 rounded-2xl border border-[var(--border-color)] bg-[var(--surface-secondary)] px-4" placeholder="Search products" />
        <select value={category} onChange={(event) => setCategory(event.target.value)} className="min-h-12 rounded-2xl border border-[var(--border-color)] bg-[var(--surface-secondary)] px-4">
          {categories.map((item) => <option key={item}>{item}</option>)}
        </select>
      </section>

      {message ? <p className="mt-4 rounded-2xl bg-[var(--brand-soft)] p-3 text-sm" role="status">{message}</p> : null}
      {loading ? <div className="dashboard-panel mt-6">Loading catalogue…</div> : null}
      {error ? <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div> : null}
      {!loading && !error && filtered.length === 0 ? <div className="dashboard-panel mt-6">No matching products.</div> : null}

      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((product) => (
          <article key={product.id} className="feature-card flex h-full flex-col">
            <div className="text-5xl" aria-hidden="true">{product.icon ?? "🌿"}</div>
            <p className="mt-4 text-xs text-[var(--brand-primary)]">{product.category}{product.tag ? ` · ${product.tag}` : ""}</p>
            <h2 className="mt-2 text-lg font-semibold">{product.name}</h2>
            <p className="mt-2 flex-1 text-sm leading-6 text-[var(--text-secondary)]">{product.description}</p>
            <div className="mt-4 flex items-end justify-between gap-3">
              <p className="text-2xl font-semibold">₹{product.price.toLocaleString("en-IN")}</p>
              <span className={`text-xs font-semibold ${product.stock > 0 ? "text-green-600" : "text-red-600"}`}>{product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}</span>
            </div>
            <button className="voice-button mt-5 w-full" disabled={!commerceEnabled || product.stock < 1} onClick={() => void add(product)}>
              {!commerceEnabled ? "Checkout disabled" : product.stock < 1 ? "Out of stock" : "Add to cart"}
            </button>
          </article>
        ))}
      </div>
    </main>
  );
}
