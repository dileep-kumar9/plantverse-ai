"use client";

import {
  Camera,
  ChevronDown,
  FileImage,
  FolderOpen,
  Globe2,
  HardDrive,
  Link2,
  Mic,
  Upload,
  Video,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import CameraCapture from "@/components/scan/CameraCapture";

export type EvidenceKind = "camera" | "photos" | "device" | "web" | "drive" | "video" | "voice";

type EvidencePickerProps = {
  onImageSelect: (file: File) => void;
  onVideoSelect: (file: File) => void;
  onVoiceComplete: (text: string) => void;
};

const sources = [
  { id: "camera", label: "Take photo or record", icon: Camera },
  { id: "photos", label: "Photos / gallery", icon: FileImage },
  { id: "device", label: "This device", icon: HardDrive },
  { id: "video", label: "Upload video", icon: Video },
  { id: "web", label: "Image web link", icon: Globe2 },
  { id: "drive", label: "Google Drive link", icon: FolderOpen },
] as const;

export default function EvidencePicker({ onImageSelect, onVideoSelect, onVoiceComplete }: EvidencePickerProps) {
  const [open, setOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [urlMode, setUrlMode] = useState<"web" | "drive" | null>(null);
  const [remoteUrl, setRemoteUrl] = useState("");
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const [remoteBusy, setRemoteBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const photosRef = useRef<HTMLInputElement | null>(null);
  const deviceRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLInputElement | null>(null);

  function startVoice() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = localStorage.getItem("plantverse-speech-language") || "en-IN";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0]?.transcript || "")
        .join(" ")
        .trim();
      const final = event.results?.[event.results.length - 1]?.isFinal;
      if (transcript && final) {
        setOpen(false);
        onVoiceComplete(transcript);
      }
    };
    recognition.start();
  }

  async function importRemoteImage() {
    if (!remoteUrl.trim()) return;
    setRemoteBusy(true);
    setRemoteError(null);
    try {
      const response = await fetch("/api/import-image", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: remoteUrl.trim() }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Unable to import this image.");
      }
      const blob = await response.blob();
      const type = blob.type || "image/jpeg";
      const extension = type.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
      onImageSelect(new File([blob], `imported-${Date.now()}.${extension}`, { type }));
      setRemoteUrl("");
      setUrlMode(null);
      setOpen(false);
    } catch (error) {
      setRemoteError(error instanceof Error ? error.message : "Unable to import image.");
    } finally {
      setRemoteBusy(false);
    }
  }

  function chooseSource(id: EvidenceKind) {
    if (id === "camera") { setCameraOpen(true); setOpen(false); return; }
    if (id === "photos") { photosRef.current?.click(); setOpen(false); return; }
    if (id === "device") { deviceRef.current?.click(); setOpen(false); return; }
    if (id === "video") { videoRef.current?.click(); setOpen(false); return; }
    setRemoteUrl("");
    setRemoteError(null);
    setUrlMode(id as "web" | "drive");
    setOpen(false);
  }

  if (cameraOpen) {
    return <CameraCapture onPhoto={onImageSelect} onVideo={onVideoSelect} onClose={() => setCameraOpen(false)} />;
  }

  return (
    <section className="relative">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <button type="button" onClick={() => setOpen((value) => !value)} className="evidence-main-button">
            <Upload size={20} /> Upload image or video <ChevronDown size={18} />
          </button>
          {open ? (
            <div className="evidence-menu">
              {sources.map(({ id, label, icon: Icon }) => (
                <button key={id} type="button" onClick={() => chooseSource(id)} className="evidence-menu-item">
                  <Icon size={20} /> <span>{label}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <button type="button" onClick={startVoice} className={listening ? "voice-listening-button" : "evidence-voice-button"}>
          <Mic size={20} /> {listening ? "Listening…" : "Explain with voice"}
        </button>
      </div>

      <p className="mt-3 text-sm text-[var(--text-secondary)]">
        Captured or selected images are inspected automatically. Voice searches automatically when recognition finishes.
      </p>

      {urlMode ? (
        <div className="mt-5 rounded-3xl border border-[var(--border-color)] bg-[var(--surface-secondary)] p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold">{urlMode === "drive" ? "Google Drive public link" : "Public image web link"}</h3>
            <button type="button" onClick={() => setUrlMode(null)} aria-label="Close"><X size={18} /></button>
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <label className="flex min-h-12 flex-1 items-center gap-2 rounded-2xl border border-[var(--border-color)] bg-[var(--surface-primary)] px-4">
              <Link2 size={18} className="text-[var(--text-secondary)]" />
              <input value={remoteUrl} onChange={(event) => setRemoteUrl(event.target.value)} className="min-w-0 flex-1 bg-transparent outline-none" placeholder="https://…" />
            </label>
            <button type="button" onClick={() => void importRemoteImage()} disabled={remoteBusy || !remoteUrl.trim()} className="voice-button">
              {remoteBusy ? "Importing…" : "Import & inspect"}
            </button>
          </div>
          {remoteError ? <p className="mt-3 text-sm text-red-600">{remoteError}</p> : null}
          {urlMode === "drive" ? <p className="mt-3 text-xs text-[var(--text-tertiary)]">Use a publicly accessible Drive file link. Private Drive Picker access requires Google OAuth credentials.</p> : null}
        </div>
      ) : null}

      <input ref={photosRef} type="file" accept="image/*" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) onImageSelect(file); event.target.value = ""; }} />
      <input ref={deviceRef} type="file" accept="image/*" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) onImageSelect(file); event.target.value = ""; }} />
      <input ref={videoRef} type="file" accept="video/*" capture="environment" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) onVideoSelect(file); event.target.value = ""; }} />
    </section>
  );
}
