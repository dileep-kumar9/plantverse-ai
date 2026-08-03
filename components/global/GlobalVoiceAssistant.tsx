"use client";

import { Camera, Keyboard, Mic, Send, Sparkles, Volume2, X } from "lucide-react";
import { useRef, useState } from "react";

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
      const scanContext = JSON.parse(localStorage.getItem("plantverse-current-result") || "null");
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: cleanMessage, context: scanContext }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to answer.");
      setReply(data.reply || "No answer was returned.");
    } catch (error) {
      setReply(error instanceof Error ? error.message : "Unable to answer.");
    } finally {
      setBusy(false);
    }
  }

  function listen() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = localStorage.getItem("plantverse-speech-language") || "en-IN";
    recognition.interimResults = true;
    recognition.continuous = false;
    transcriptRef.current = "";
    recognition.onstart = () => { setOpen(true); setListening(true); setReply(""); };
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results).map((result: any) => result[0]?.transcript || "").join(" ").trim();
      if (transcript) {
        transcriptRef.current = transcript;
        setText(transcript);
      }
      const final = event.results?.[event.results.length - 1]?.isFinal;
      if (transcript && final) {
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
    speechSynthesis.cancel();
    speechSynthesis.speak(new SpeechSynthesisUtterance(reply));
  }

  return (
    <>
      <button className={listening ? "global-ai-button is-listening" : "global-ai-button"} onClick={listen} aria-label="Speak to Plant AI" title="Speak to Plant AI">
        {listening ? <span className="voice-wave"><i /><i /><i /><i /></span> : <Sparkles size={23} />}
      </button>

      {open ? (
        <section className="voice-panel" role="dialog" aria-label="PlantVerse AI assistant">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2"><Sparkles size={18} className="shrink-0 text-[var(--brand-primary)]" /><div className="min-w-0"><h2 className="font-semibold">PlantVerse AI</h2><p className="truncate text-xs text-[var(--text-secondary)]">Voice submits automatically after you finish speaking</p></div></div>
            <button onClick={() => setOpen(false)} aria-label="Close assistant" className="shrink-0"><X size={19} /></button>
          </div>

          <textarea value={text} onChange={(event) => setText(event.target.value)} rows={3} className="mt-4 w-full resize-none rounded-2xl border border-[var(--border-color)] bg-[var(--surface-secondary)] p-3 outline-none" placeholder="Speak or type from any screen…" />

          <div className="mt-3 flex flex-wrap gap-2">
            <button className="outline-button" onClick={listen} disabled={listening}><Mic size={17} />{listening ? "Listening…" : "Speak"}</button>
            <a href="/scan" className="outline-button"><Camera size={17} />Camera</a>
            <button className="outline-button" onClick={() => document.querySelector<HTMLTextAreaElement>(".voice-panel textarea")?.focus()}><Keyboard size={17} />Type</button>
            <button className="voice-button" onClick={() => void send()} disabled={busy}><Send size={17} />{busy ? "Searching…" : "Ask AI"}</button>
          </div>

          {reply ? <div className="mt-4 rounded-2xl bg-[var(--surface-secondary)] p-4 text-sm leading-6"><div className="flex justify-end"><button onClick={readReply} aria-label="Read answer aloud"><Volume2 size={17} /></button></div><div className="whitespace-pre-wrap break-words">{reply}</div></div> : null}
        </section>
      ) : null}
    </>
  );
}
