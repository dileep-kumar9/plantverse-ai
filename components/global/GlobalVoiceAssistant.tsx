"use client";

import { Camera, Keyboard, Mic, Send, Sparkles, Volume2, X } from "lucide-react";
import { useRef, useState } from "react";
import { apiFetch, listRecords } from "@/lib/client-api";
import type { SavedAnalysis } from "@/types/analysis";

function transientContext(): SavedAnalysis | null {
  try {
    const raw = window.sessionStorage.getItem("plantverse-current-result");
    return raw ? (JSON.parse(raw) as SavedAnalysis) : null;
  } catch {
    return null;
  }
}

export default function GlobalVoiceAssistant() {
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [text, setText] = useState("");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const transcriptRef = useRef("");

  async function send(message = text) {
    const cleanMessage = message.trim();
    if (!cleanMessage || busy) return;
    setOpen(true);
    setText(cleanMessage);
    setBusy(true);
    setReply("Searching…");
    try {
      let context = transientContext();
      if (!context) {
        const reports = await listRecords<SavedAnalysis>("analyses");
        context = reports.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
      }
      const response = await apiFetch<{ reply: string }>("/api/assistant", {
        method: "POST",
        body: JSON.stringify({ message: cleanMessage, context }),
      });
      setReply(response.reply || "No answer was returned.");
    } catch (error) {
      setReply(error instanceof Error ? error.message : "Unable to answer.");
    } finally {
      setBusy(false);
    }
  }

  function listen() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setOpen(true);
      setReply("Speech recognition is not supported by this browser. You can type your question instead.");
      return;
    }
    const recognition = new Recognition();
    recognition.lang = window.localStorage.getItem("plantverse-speech-language") || "en-IN";
    recognition.interimResults = true;
    recognition.continuous = false;
    transcriptRef.current = "";
    recognition.onstart = () => { setOpen(true); setListening(true); setReply(""); };
    recognition.onerror = () => { setListening(false); setReply("Speech recognition stopped. Please try again or type your question."); };
    recognition.onresult = (event) => {
      const fragments: string[] = [];
      for (let index = 0; index < event.results.length; index += 1) {
        fragments.push(event.results[index]?.[0]?.transcript || "");
      }
      const transcript = fragments.join(" ").trim();
      if (transcript) {
        transcriptRef.current = transcript;
        setText(transcript);
      }
      const last = event.results[event.results.length - 1];
      if (transcript && last?.isFinal) {
        transcriptRef.current = "";
        void send(transcript);
      }
    };
    recognition.onend = () => {
      setListening(false);
      const transcript = transcriptRef.current.trim();
      if (transcript) {
        transcriptRef.current = "";
        void send(transcript);
      }
    };
    recognition.start();
  }

  function readReply() {
    if (!reply || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(reply));
  }

  return (
    <>
      <button className={listening ? "global-ai-button is-listening" : "global-ai-button"} onClick={listen} aria-label="Speak to Plant AI" title="Speak to Plant AI">
        {listening ? <span className="voice-wave"><i /><i /><i /><i /></span> : <Sparkles size={23} />}
      </button>

      {open ? (
        <section className="voice-panel" role="dialog" aria-modal="false" aria-label="PlantVerse AI assistant">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2"><Sparkles size={18} className="shrink-0 text-[var(--brand-primary)]" /><div className="min-w-0"><h2 className="font-semibold">PlantVerse AI</h2><p className="truncate text-xs text-[var(--text-secondary)]">Voice submits after you finish speaking</p></div></div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close assistant" className="shrink-0"><X size={19} /></button>
          </div>

          <textarea value={text} onChange={(event) => setText(event.target.value)} rows={3} maxLength={2000} className="mt-4 w-full resize-none rounded-2xl border border-[var(--border-color)] bg-[var(--surface-secondary)] p-3 outline-none" placeholder="Speak or type from any screen…" />

          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="outline-button" onClick={listen} disabled={listening}><Mic size={17} />{listening ? "Listening…" : "Speak"}</button>
            <a href="/scan" className="outline-button"><Camera size={17} />Camera</a>
            <button type="button" className="outline-button" onClick={() => document.querySelector<HTMLTextAreaElement>(".voice-panel textarea")?.focus()}><Keyboard size={17} />Type</button>
            <button type="button" className="voice-button" onClick={() => void send()} disabled={busy || !text.trim()}><Send size={17} />{busy ? "Searching…" : "Ask AI"}</button>
          </div>

          {reply ? <div className="mt-4 rounded-2xl bg-[var(--surface-secondary)] p-4 text-sm leading-6"><div className="flex justify-end"><button type="button" onClick={readReply} aria-label="Read answer aloud"><Volume2 size={17} /></button></div><div className="whitespace-pre-wrap break-words">{reply}</div></div> : null}
        </section>
      ) : null}
    </>
  );
}
