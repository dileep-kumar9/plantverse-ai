"use client";

import { useMemo, useState } from "react";
import PageIntro from "@/components/shared/PageIntro";
import { useCollection } from "@/hooks/useCollection";
import { apiFetch, listRecords } from "@/lib/client-api";
import type { SavedAnalysis } from "@/types/analysis";

type ChatMessage = {
  id: string;
  role: "user" | "ai";
  text: string;
  createdAt: string;
};

export default function AssistantPage() {
  const { items, loading, create, remove } = useCollection<ChatMessage>("chats");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [level, setLevel] = useState("beginner");
  const [language, setLanguage] = useState("English");
  const [error, setError] = useState("");
  const messages = useMemo(() => [...items].sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [items]);

  async function send() {
    const question = text.trim();
    if (!question || busy) return;
    setBusy(true);
    setError("");
    setText("");
    try {
      await create({ role: "user", text: question, createdAt: new Date().toISOString() });
      const analyses = await listRecords<SavedAnalysis>("analyses");
      let transient: SavedAnalysis | null = null;
      try {
        transient = JSON.parse(window.sessionStorage.getItem("plantverse-current-result") || "null") as SavedAnalysis | null;
      } catch {
        transient = null;
      }
      const response = await apiFetch<{ reply: string }>("/api/assistant", {
        method: "POST",
        body: JSON.stringify({
          message: question,
          context: { latestAnalysis: transient || analyses[0] || null, recentMemory: analyses.slice(0, 3) },
          level,
          language,
        }),
      });
      await create({ role: "ai", text: response.reply || "Unable to answer.", createdAt: new Date().toISOString() });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to answer.");
    } finally {
      setBusy(false);
    }
  }

  async function clearHistory() {
    if (!window.confirm("Delete this chat history?")) return;
    for (const message of items) await remove(message.id);
  }

  return (
    <main className="page-wrap">
      <PageIntro eyebrow="Context-aware copilot" title="Plant AI Assistant" description="The assistant can use your latest scan and recent private Plant Memory. AI answers can be wrong, so verify high-impact treatment decisions." action={items.length ? <button type="button" onClick={() => void clearHistory()} className="outline-button">Clear chat</button> : undefined} />
      <div className="mt-6 flex flex-wrap gap-3"><select value={language} onChange={(event) => setLanguage(event.target.value)} className="outline-button"><option>English</option><option>Telugu</option><option>Hindi</option><option>Tamil</option><option>Kannada</option></select><select value={level} onChange={(event) => setLevel(event.target.value)} className="outline-button"><option value="beginner">Beginner</option><option value="farmer">Farmer</option><option value="expert">Expert</option></select></div>
      <section className="dashboard-panel mt-6">
        <div className="min-h-96 space-y-4">
          {!loading && !messages.length ? <div className="max-w-3xl rounded-2xl bg-[var(--surface-secondary)] p-4">Ask about a plant, soil, growing space, saved report, device, fertilizer, pesticide safety, or weather-aware care.</div> : null}
          {messages.map((message) => <div key={message.id} className={`max-w-3xl whitespace-pre-wrap rounded-2xl p-4 ${message.role === "user" ? "ml-auto bg-[var(--brand-primary)] text-white" : "bg-[var(--surface-secondary)]"}`}>{message.text}</div>)}
          {busy ? <div className="rounded-2xl bg-[var(--surface-secondary)] p-4">Thinking…</div> : null}
          {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div> : null}
        </div>
        <div className="mt-5 flex gap-3"><input value={text} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void send(); }} className="min-w-0 flex-1 rounded-full border border-[var(--border-color)] bg-[var(--surface-secondary)] px-5" placeholder="Ask a follow-up question…" maxLength={2000} /><button onClick={() => void send()} disabled={busy} className="voice-button">Send</button></div>
      </section>
    </main>
  );
}
