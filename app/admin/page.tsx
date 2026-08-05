"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import PageIntro from "@/components/shared/PageIntro";
import { apiFetch } from "@/lib/client-api";
import type { AuditRecord, CommunityPost, Order, Product } from "@/types/app";

type Tab = "readiness" | "products" | "orders" | "experts" | "community" | "backups" | "audit";
type Expert = {
  id: string;
  userId?: string;
  email?: string;
  displayName?: string;
  specialization?: string;
  credentials?: string;
  status?: "verified" | "suspended" | "rejected";
};
type ServiceCheck = { name: string; configured: boolean; ok: boolean; detail: string };
type Backup = { id: string; operationName?: string; outputUriPrefix?: string; status?: string; createdAt?: unknown };

const tabs: Array<[Tab, string]> = [
  ["readiness", "Readiness"], ["products", "Products"], ["orders", "Orders"],
  ["experts", "Experts"], ["community", "Community"], ["backups", "Backups"], ["audit", "Audit"],
];

function money(value: number | undefined): string {
  return `₹${Number(value ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>("readiness");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [checks, setChecks] = useState<ServiceCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [productDraft, setProductDraft] = useState({ id: "", sku: "", name: "", description: "", category: "General", price: "", stock: "0", active: true });
  const [expertDraft, setExpertDraft] = useState({ userId: "", email: "", displayName: "", specialization: "", credentials: "" });

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [productData, orderData, expertData, postData, backupData, auditData, healthData] = await Promise.all([
        apiFetch<{ items: Product[] }>("/api/admin/products"),
        apiFetch<{ items: Order[] }>("/api/admin/orders"),
        apiFetch<{ items: Expert[] }>("/api/admin/experts"),
        apiFetch<{ items: CommunityPost[] }>("/api/community?moderation=all"),
        apiFetch<{ items: Backup[] }>("/api/admin/backups"),
        apiFetch<{ items: AuditRecord[] }>("/api/admin/audit?limit=100"),
        apiFetch<{ checks: ServiceCheck[] }>("/api/admin/health"),
      ]);
      setProducts(productData.items); setOrders(orderData.items); setExperts(expertData.items);
      setPosts(postData.items); setBackups(backupData.items); setAudits(auditData.items); setChecks(healthData.checks);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load the admin console.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (user?.role === "admin") void load();
    else if (!authLoading) setLoading(false);
  }, [authLoading, load, user?.role]);

  const failedChecks = useMemo(() => checks.filter((check) => !check.ok).length, [checks]);

  async function createProduct() {
    setError("");
    try {
      const response = await apiFetch<{ item: Product }>("/api/admin/products", {
        method: "POST",
        body: JSON.stringify({ ...productDraft, price: Number(productDraft.price), stock: Number(productDraft.stock) }),
      });
      setProducts((current) => [...current, response.item].sort((a, b) => a.name.localeCompare(b.name)));
      setProductDraft({ id: "", sku: "", name: "", description: "", category: "General", price: "", stock: "0", active: true });
      setMessage("Product created.");
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to create product."); }
  }

  async function patchProduct(product: Product, patch: Record<string, unknown>) {
    try {
      const response = await apiFetch<{ item: Product }>(`/api/admin/products/${encodeURIComponent(product.id)}`, { method: "PATCH", body: JSON.stringify(patch) });
      setProducts((current) => current.map((item) => item.id === product.id ? response.item : item));
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to update product."); }
  }

  async function orderAction(order: Order, action: "processing" | "cancelled" | "shipment" | "shipment_cancel" | "sync" | "refund") {
    setError("");
    try {
      if (action === "shipment" || action === "shipment_cancel" || action === "sync") {
        const shipmentAction = action === "sync" ? "sync" : action === "shipment_cancel" ? "cancel" : "create";
        await apiFetch(`/api/admin/orders/${encodeURIComponent(order.id)}/shipment`, { method: "POST", body: JSON.stringify({ action: shipmentAction }) });
      } else if (action === "refund") {
        const amountText = window.prompt(`Refund amount (maximum ${money(order.amountPaid ?? order.total)})`, String(order.amountPaid ?? order.total));
        if (!amountText) return;
        await apiFetch(`/api/admin/orders/${encodeURIComponent(order.id)}/refund`, { method: "POST", body: JSON.stringify({ amount: Number(amountText), restock: true, reason: "requested_by_customer" }) });
      } else {
        await apiFetch(`/api/admin/orders/${encodeURIComponent(order.id)}`, { method: "PATCH", body: JSON.stringify({ status: action }) });
      }
      setMessage("Order operation submitted."); await load();
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Order operation failed."); }
  }

  async function createExpert() {
    try {
      const response = await apiFetch<{ item: Expert }>("/api/admin/experts", { method: "POST", body: JSON.stringify(expertDraft) });
      setExperts((current) => [response.item, ...current]);
      setExpertDraft({ userId: "", email: "", displayName: "", specialization: "", credentials: "" });
      setMessage("Expert verified.");
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to verify expert."); }
  }

  async function updateExpert(expert: Expert, status: Expert["status"]) {
    if (!status) return;
    try {
      const response = await apiFetch<{ item: Expert }>(`/api/admin/experts/${encodeURIComponent(expert.id)}`, { method: "PATCH", body: JSON.stringify({ status }) });
      setExperts((current) => current.map((item) => item.id === expert.id ? response.item : item));
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to update expert."); }
  }

  async function moderate(post: CommunityPost, action: "hide" | "delete") {
    try {
      if (action === "delete") {
        await apiFetch(`/api/community/${post.id}`, { method: "DELETE" });
        setPosts((current) => current.filter((item) => item.id !== post.id));
      } else {
        const response = await apiFetch<{ item: CommunityPost }>(`/api/community/${post.id}`, { method: "PATCH", body: JSON.stringify({ action: "hide" }) });
        setPosts((current) => current.map((item) => item.id === post.id ? response.item : item));
      }
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to moderate post."); }
  }

  async function startBackup() {
    try { await apiFetch("/api/admin/backups", { method: "POST", body: "{}" }); setMessage("Firestore export requested."); await load(); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to start backup."); }
  }

  async function testMonitoring() {
    try {
      const response = await apiFetch<{ marker: string }>("/api/admin/monitoring/test", {
        method: "POST",
        body: "{}",
      });
      setMessage(`Monitoring event sent. Verify marker ${response.marker} in your provider.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to test monitoring.");
    }
  }

  if (!authLoading && user?.role !== "admin") {
    return <main className="page-wrap"><div className="dashboard-panel"><h1 className="text-2xl font-semibold">Administrator access required</h1><p className="mt-3 text-[var(--text-secondary)]">Add your verified email to ADMIN_EMAILS before using this area.</p></div></main>;
  }

  return <main className="page-wrap">
    <PageIntro eyebrow="Operations" title="Public launch admin console" description="Manage catalogue stock, payments, fulfilment, verified experts, moderation, backups, audits and provider readiness." />
    <div className="mt-6 flex flex-wrap gap-2" role="tablist">{tabs.map(([value, label]) => <button key={value} type="button" className={tab === value ? "voice-button" : "outline-button"} onClick={() => setTab(value)}>{label}</button>)}</div>
    {error ? <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700" role="alert">{error}</div> : null}
    {message ? <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-700" role="status">{message}</div> : null}
    {loading ? <div className="dashboard-panel mt-6">Loading administration data…</div> : null}

    {!loading && tab === "readiness" ? <section className="mt-6 grid gap-4 md:grid-cols-2"><div className="dashboard-panel md:col-span-2"><h2 className="text-xl font-semibold">Launch readiness</h2><p className="mt-2 text-sm text-[var(--text-secondary)]">{failedChecks === 0 ? "All configured service checks passed." : `${failedChecks} check(s) require attention.`}</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" className="outline-button" onClick={() => void load()}>Run checks again</button><button type="button" className="outline-button" onClick={() => void testMonitoring()}>Send monitoring test</button></div></div>{checks.map((check) => <article key={check.name} className="dashboard-panel"><div className="flex items-center justify-between gap-4"><h3 className="font-semibold">{check.name}</h3><span className={check.ok ? "health-pill" : "rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700"}>{check.ok ? "Passed" : check.configured ? "Failed" : "Missing"}</span></div><p className="mt-3 text-sm text-[var(--text-secondary)]">{check.detail}</p></article>)}</section> : null}

    {!loading && tab === "products" ? <section className="mt-6"><div className="dashboard-panel"><h2 className="text-xl font-semibold">Create product</h2><div className="mt-4 grid gap-3 md:grid-cols-4">{(["id", "sku", "name", "category", "price", "stock"] as const).map((field) => <label key={field} className="text-sm font-medium">{field}<input value={productDraft[field]} onChange={(event) => setProductDraft((current) => ({ ...current, [field]: event.target.value }))} className="mt-1 w-full rounded-xl border p-3" /></label>)}</div><label className="mt-3 block text-sm font-medium">Description<textarea value={productDraft.description} onChange={(event) => setProductDraft((current) => ({ ...current, description: event.target.value }))} className="mt-1 w-full rounded-xl border p-3" /></label><button type="button" className="voice-button mt-4" onClick={() => void createProduct()}>Create product</button></div><div className="mt-4 grid gap-4 lg:grid-cols-2">{products.map((product) => <article key={product.id} className="dashboard-panel"><div className="flex items-start justify-between gap-4"><div><h3 className="font-semibold">{product.name}</h3><p className="text-sm text-[var(--text-secondary)]">{product.sku} · {money(product.price)}</p></div><span className="health-pill">{product.active ? "Active" : "Archived"}</span></div><p className="mt-3 text-sm">Stock {product.stock} · Reserved {product.reserved} · Sold {product.sold}</p><div className="mt-4 flex flex-wrap gap-2"><button className="outline-button" onClick={() => { const value = window.prompt("New available stock", String(product.stock)); if (value !== null) void patchProduct(product, { stock: Number(value) }); }}>Update stock</button><button className="outline-button" onClick={() => void patchProduct(product, { active: !product.active })}>{product.active ? "Archive" : "Activate"}</button></div></article>)}</div></section> : null}

    {!loading && tab === "orders" ? <section className="mt-6 space-y-4">{orders.length === 0 ? <div className="dashboard-panel">No orders.</div> : orders.map((order) => <article key={order.id} className="dashboard-panel"><div className="flex flex-col gap-4 lg:flex-row lg:justify-between"><div><p className="text-xs text-[var(--text-secondary)]">{order.orderNumber || order.id}</p><h3 className="mt-1 font-semibold">{order.customerEmail || "Customer"}</h3><p className="mt-2">{money(order.total)} · {order.status.replaceAll("_", " ")}</p><p className="mt-2 text-sm text-[var(--text-secondary)]">{order.items.map((item) => `${item.name} × ${item.quantity}`).join(", ")}</p></div><div className="flex flex-wrap gap-2"><button className="outline-button" onClick={() => void orderAction(order, "processing")}>Process</button><button className="outline-button" onClick={() => void orderAction(order, "shipment")}>Create shipment</button><button className="outline-button" onClick={() => void orderAction(order, "sync")}>Sync tracking</button><button className="outline-button" onClick={() => void orderAction(order, "shipment_cancel")}>Cancel shipment</button><button className="outline-button" onClick={() => void orderAction(order, "refund")}>Stripe refund</button><button className="outline-button text-red-600" onClick={() => void orderAction(order, "cancelled")}>Cancel</button></div></div></article>)}</section> : null}

    {!loading && tab === "experts" ? <section className="mt-6"><div className="dashboard-panel"><h2 className="text-xl font-semibold">Verify expert</h2><div className="mt-4 grid gap-3 md:grid-cols-2">{(Object.keys(expertDraft) as Array<keyof typeof expertDraft>).map((field) => <label key={field} className="text-sm font-medium">{field}<input value={expertDraft[field]} onChange={(event) => setExpertDraft((current) => ({ ...current, [field]: event.target.value }))} className="mt-1 w-full rounded-xl border p-3" /></label>)}</div><button className="voice-button mt-4" onClick={() => void createExpert()}>Verify expert</button></div><div className="mt-4 space-y-4">{experts.map((expert) => <article className="dashboard-panel" key={expert.id}><h3 className="font-semibold">{expert.displayName || expert.email}</h3><p className="mt-1 text-sm text-[var(--text-secondary)]">{expert.specialization} · {expert.status}</p><p className="mt-2 text-sm">{expert.credentials}</p><div className="mt-3 flex gap-2"><button className="outline-button" onClick={() => void updateExpert(expert, "verified")}>Verify</button><button className="outline-button" onClick={() => void updateExpert(expert, "suspended")}>Suspend</button><button className="outline-button text-red-600" onClick={() => void updateExpert(expert, "rejected")}>Reject</button></div></article>)}</div></section> : null}

    {!loading && tab === "community" ? <section className="mt-6 space-y-4">{posts.map((post) => <article key={post.id} className="dashboard-panel"><p className="text-xs text-[var(--text-secondary)]">{post.authorName} {post.verifiedExpert ? "· Verified expert" : ""} · {post.reports} reports · {post.status}</p><h3 className="mt-2 font-semibold">{post.title}</h3><p className="mt-2 whitespace-pre-wrap text-sm">{post.body}</p><div className="mt-3 flex gap-2">{post.status !== "hidden" ? <button className="outline-button" onClick={() => void moderate(post, "hide")}>Hide</button> : null}<button className="outline-button text-red-600" onClick={() => void moderate(post, "delete")}>Delete</button></div></article>)}</section> : null}

    {!loading && tab === "backups" ? <section className="mt-6"><div className="dashboard-panel"><h2 className="text-xl font-semibold">Firestore exports</h2><p className="mt-2 text-sm text-[var(--text-secondary)]">Exports require a Google Cloud Storage bucket and IAM import/export permissions. Restoration is a separate, audited operator procedure.</p><button className="voice-button mt-4" onClick={() => void startBackup()}>Start export</button></div><div className="mt-4 space-y-3">{backups.map((backup) => <article key={backup.id} className="dashboard-panel"><p className="font-semibold">{backup.status || "requested"}</p><p className="mt-2 break-all text-sm text-[var(--text-secondary)]">{backup.outputUriPrefix}</p><p className="mt-1 break-all text-xs">{backup.operationName}</p></article>)}</div></section> : null}

    {!loading && tab === "audit" ? <section className="mt-6 overflow-x-auto rounded-3xl border border-[var(--border-color)] bg-[var(--surface-primary)]"><table className="min-w-full text-left text-sm"><thead><tr className="border-b"><th className="p-4">Time</th><th className="p-4">Actor</th><th className="p-4">Action</th><th className="p-4">Resource</th><th className="p-4">Outcome</th></tr></thead><tbody>{audits.map((audit) => <tr className="border-b last:border-0" key={audit.id}><td className="p-4">{new Date(audit.createdAt).toLocaleString()}</td><td className="p-4">{audit.actorEmail || audit.actorId || "system"}</td><td className="p-4">{audit.action}</td><td className="p-4">{audit.resourceType} {audit.resourceId || ""}</td><td className="p-4">{audit.outcome}</td></tr>)}</tbody></table></section> : null}
  </main>;
}
