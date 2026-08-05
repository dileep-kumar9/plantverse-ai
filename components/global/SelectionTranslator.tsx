"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/client-api";

export default function SelectionTranslator() {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState("");
  const [language, setLanguage] = useState("Telugu");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function pick() {
      const selection = window.getSelection()?.toString().trim() || "";
      if (selection.length > 2 && selection.length < 2000) {
        setText(selection);
        setOpen(true);
        setResult("");
        setError("");
      }
    }
    document.addEventListener("mouseup", pick);
    return () => document.removeEventListener("mouseup", pick);
  }, []);

  async function translate() {
    if (!text.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await apiFetch<{ translation: string }>("/api/translate", {
        method: "POST",
        body: JSON.stringify({ text, targetLanguage: language, context: "selected PlantVerse content", mode: "stacked" }),
      });
      setResult(response.translation);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to translate selected text.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;
  return (
    <section className="selection-translator" role="dialog" aria-label="Translate selected text">
      <div className="flex justify-between gap-3"><b>Selected text</b><button type="button" onClick={() => setOpen(false)} aria-label="Close translator">✕</button></div>
      <p className="mt-2 line-clamp-3 text-sm text-[var(--text-secondary)]">{text}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <select value={language} onChange={(event) => setLanguage(event.target.value)} className="outline-button" aria-label="Translation language"><option>Telugu</option><option>Hindi</option><option>Tamil</option><option>Kannada</option><option>English</option></select>
        <button type="button" onClick={() => void translate()} disabled={busy} className="voice-button">{busy ? "Translating…" : "Translate"}</button>
      </div>
      {error ? <p className="mt-3 text-sm text-red-600" role="alert">{error}</p> : null}
      {result ? <div className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-2xl bg-[var(--surface-secondary)] p-3 text-sm">{result}</div> : null}
    </section>
  );
}
