"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Flag, Trash2 } from "lucide-react";
import PageIntro from "@/components/shared/PageIntro";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiFetch } from "@/lib/client-api";
import type { CommunityPost } from "@/types/app";

export default function CommunityPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tag, setTag] = useState("General");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiFetch<{ items: CommunityPost[] }>("/api/community");
      setPosts(response.items);
      setError("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load community posts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function add(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setBusy(true);
    setError("");
    try {
      const response = await apiFetch<{ item: CommunityPost }>("/api/community", {
        method: "POST",
        body: JSON.stringify({ title, body, tag }),
      });
      setPosts((current) => [response.item, ...current]);
      setTitle("");
      setBody("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to publish post.");
    } finally {
      setBusy(false);
    }
  }

  async function report(post: CommunityPost) {
    if (!window.confirm("Report this post for moderator review?")) return;
    await apiFetch(`/api/community/${post.id}`, {
      method: "PATCH",
      body: JSON.stringify({ action: "report" }),
    });
    await load();
  }

  async function remove(post: CommunityPost) {
    if (!window.confirm("Delete this post?")) return;
    await apiFetch(`/api/community/${post.id}`, { method: "DELETE" });
    setPosts((current) => current.filter((item) => item.id !== post.id));
  }

  return (
    <main className="page-wrap">
      <PageIntro
        eyebrow="Grow together"
        title="Community & Expert Help"
        description="Share plant and growing questions under your account. Posts can be reported and moderated."
      />
      <form onSubmit={add} className="dashboard-panel mt-8">
        <input required maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} className="w-full rounded-2xl border p-3" placeholder="Question title" />
        <textarea required maxLength={3000} value={body} onChange={(event) => setBody(event.target.value)} className="mt-3 w-full rounded-2xl border p-3" rows={4} placeholder="Describe the issue, conditions, and what you already tried" />
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input maxLength={40} value={tag} onChange={(event) => setTag(event.target.value)} className="rounded-2xl border p-3" placeholder="Tag" />
          <button disabled={busy} className="voice-button">{busy ? "Publishing…" : "Publish post"}</button>
        </div>
        <p className="mt-3 text-xs text-[var(--text-secondary)]">Do not post personal contact details, prescriptions, or unsafe chemical instructions.</p>
      </form>

      {error ? <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div> : null}
      {loading ? <div className="dashboard-panel mt-5">Loading community…</div> : null}
      <div className="mt-5 space-y-4">
        {posts.map((post) => (
          <article key={post.id} className="dashboard-panel">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><span className="health-pill">{post.tag}</span><p className="mt-3 text-xs text-[var(--text-secondary)]">Posted by {post.authorName} · {new Date(post.createdAt).toLocaleString()}</p></div>
              <div className="flex gap-2">
                {post.authorId === user?.id || user?.role === "admin" ? (
                  <button type="button" onClick={() => void remove(post)} className="icon-button text-red-500" aria-label="Delete post"><Trash2 size={17} /></button>
                ) : (
                  <button type="button" onClick={() => void report(post)} className="icon-button" aria-label="Report post"><Flag size={17} /></button>
                )}
              </div>
            </div>
            <h2 className="mt-3 text-xl font-semibold">{post.title}</h2>
            <p className="mt-2 whitespace-pre-wrap text-[var(--text-secondary)]">{post.body}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
