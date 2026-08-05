"use client";

import { useState } from "react";
import PageIntro from "@/components/shared/PageIntro";
import { apiFetch } from "@/lib/client-api";

export default function TranslatorPage() {
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("Telugu");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function translate() {
    if (!text.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await apiFetch<{ translation: string }>("/api/translate", {
        method: "POST",
        body: JSON.stringify({ text, targetLanguage: language, context: "plant diagnosis and treatment", mode: "line-by-line" }),
      });
      setResult(response.translation);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to translate this text.");
    } finally {
      setBusy(false);
    }
  }

  function speak() {
    if (!result || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(result));
  }

  async function copy() {
    if (result) await navigator.clipboard.writeText(result);
  }

  return (
    <main className="page-wrap">
      <PageIntro eyebrow="Context-aware agriculture translation" title="Plant Translator" description="Translate complete reports or selected text while preserving scientific names and safety meaning." />
      <div className="mt-6 flex gap-3"><select value={language} onChange={(event) => setLanguage(event.target.value)} className="outline-button" aria-label="Target language"><option>Telugu</option><option>Hindi</option><option>Tamil</option><option>Kannada</option><option>English</option></select></div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="dashboard-panel"><label className="font-semibold" htmlFor="translation-source">Text to translate</label><textarea id="translation-source" value={text} onChange={(event) => setText(event.target.value)} rows={14} maxLength={10000} className="mt-3 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--surface-secondary)] p-4" placeholder="Paste plant care instructions or a report…" /><button type="button" onClick={() => void translate()} disabled={busy || !text.trim()} className="voice-button mt-4">{busy ? "Translating…" : "Translate line by line"}</button>{error ? <p className="mt-3 text-sm text-red-600" role="alert">{error}</p> : null}</section>
        <section className="dashboard-panel"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">{language} translation</h2><div className="flex gap-3"><button type="button" onClick={speak} disabled={!result}>🔊 Listen</button><button type="button" onClick={() => void copy()} disabled={!result}>Copy</button></div></div><pre className="mt-4 whitespace-pre-wrap font-sans leading-7 text-[var(--text-secondary)]">{result || "Translation appears here."}</pre></section>
      </div>
    </main>
  );
}
