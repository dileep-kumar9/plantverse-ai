"use client";

import {
  Camera,
  ChevronDown,
  FolderOpen,
  Globe2,
  HardDrive,
  Link2,
  Mic,
  Upload,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import CameraCapture from "@/components/scan/CameraCapture";

export type EvidenceKind = "camera" | "device" | "web" | "drive";

type EvidencePickerProps = {
  onImageSelect: (file: File) => void;
  onVideoSelect: (file: File) => void;
  onVoiceComplete: (text: string) => void;
};

const sources = [
  { id: "camera", label: "Open camera", description: "Capture a photo or record a video", icon: Camera },
  { id: "device", label: "This device", description: "Choose a photo or video; PlantVerse detects it automatically", icon: HardDrive },
  { id: "web", label: "Web link", description: "Import a public photo or video URL", icon: Globe2 },
  { id: "drive", label: "Google Drive", description: "Open Drive and paste a public photo or video link", icon: FolderOpen },
] as const;

export default function EvidencePicker({ onImageSelect, onVideoSelect, onVoiceComplete }: EvidencePickerProps) {
  const [open, setOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [urlMode, setUrlMode] = useState<"web" | "drive" | null>(null);
  const [remoteUrl, setRemoteUrl] = useState("");
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const [remoteBusy, setRemoteBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const deviceRef = useRef<HTMLInputElement | null>(null);
  const finalTranscriptRef = useRef("");

  function routeFile(file: File) {
    if (file.type.startsWith("image/")) {
      onImageSelect(file);
      return;
    }
    if (file.type.startsWith("video/")) {
      onVideoSelect(file);
      return;
    }
    setRemoteError("Choose an image or video file.");
  }

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
    finalTranscriptRef.current = "";

    recognition.onstart = () => setListening(true);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0]?.transcript || "")
        .join(" ")
        .trim();
      if (transcript) finalTranscriptRef.current = transcript;

      const final = event.results?.[event.results.length - 1]?.isFinal;
      if (transcript && final) {
        finalTranscriptRef.current = "";
        setOpen(false);
        onVoiceComplete(transcript);
      }
    };
    recognition.onend = () => {
      setListening(false);
      const transcript = finalTranscriptRef.current.trim();
      if (transcript) {
        finalTranscriptRef.current = "";
        setOpen(false);
        onVoiceComplete(transcript);
      }
    };
    recognition.start();
  }

  async function importRemoteMedia() {
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
        throw new Error(payload?.error || "Unable to import this media file.");
      }

      const blob = await response.blob();
      const type = blob.type || "application/octet-stream";
      const extension = type.split("/")[1]?.replace("jpeg", "jpg").replace("quicktime", "mov") || "bin";
      const file = new File([blob], `imported-${Date.now()}.${extension}`, { type });
      routeFile(file);
      setRemoteUrl("");
      setUrlMode(null);
      setOpen(false);
    } catch (error) {
      setRemoteError(error instanceof Error ? error.message : "Unable to import media.");
    } finally {
      setRemoteBusy(false);
    }
  }

  function chooseSource(id: EvidenceKind) {
    if (id === "camera") {
      setCameraOpen(true);
      setOpen(false);
      return;
    }
    if (id === "device") {
      deviceRef.current?.click();
      setOpen(false);
      return;
    }
    setRemoteUrl("");
    setRemoteError(null);
    setUrlMode(id);
    setOpen(false);
  }

  if (cameraOpen) {
    return <CameraCapture onPhoto={onImageSelect} onVideo={onVideoSelect} onClose={() => setCameraOpen(false)} />;
  }

  return (
    <section className="relative">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <button type="button" onClick={() => setOpen((value) => !value)} className="evidence-main-button" aria-expanded={open}>
            <Upload size={20} /> Add photo or video <ChevronDown size={18} />
          </button>
          {open ? (
            <div className="evidence-menu">
              {sources.map(({ id, label, description, icon: Icon }) => (
                <button key={id} type="button" onClick={() => chooseSource(id)} className="evidence-menu-item">
                  <Icon size={20} className="shrink-0" />
                  <span>
                    <span className="block">{label}</span>
                    <span className="mt-0.5 block text-xs font-normal text-[var(--text-secondary)]">{description}</span>
                  </span>
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
        One device picker accepts both photos and videos. PlantVerse detects the file type and starts the correct inspection automatically.
      </p>

      {urlMode ? (
        <div className="mt-5 rounded-3xl border border-[var(--border-color)] bg-[var(--surface-secondary)] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">{urlMode === "drive" ? "Import from Google Drive" : "Import a public web link"}</h3>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">Public image and video files are supported.</p>
            </div>
            <button type="button" onClick={() => setUrlMode(null)} aria-label="Close"><X size={18} /></button>
          </div>

          {urlMode === "drive" ? (
            <a href="https://drive.google.com/drive/my-drive" target="_blank" rel="noreferrer" className="outline-button mt-4 inline-flex">
              <FolderOpen size={18} /> Open Google Drive
            </a>
          ) : null}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <label className="flex min-h-12 flex-1 items-center gap-2 rounded-2xl border border-[var(--border-color)] bg-[var(--surface-primary)] px-4">
              <Link2 size={18} className="text-[var(--text-secondary)]" />
              <input value={remoteUrl} onChange={(event) => setRemoteUrl(event.target.value)} className="min-w-0 flex-1 bg-transparent outline-none" placeholder={urlMode === "drive" ? "Paste a public Google Drive file link" : "Paste a public image or video URL"} />
            </label>
            <button type="button" onClick={() => void importRemoteMedia()} disabled={remoteBusy || !remoteUrl.trim()} className="voice-button">
              {remoteBusy ? "Importing…" : "Import & inspect"}
            </button>
          </div>
          {remoteError ? <p className="mt-3 text-sm text-red-600">{remoteError}</p> : null}
          {urlMode === "drive" ? <p className="mt-3 text-xs text-[var(--text-tertiary)]">Set the Drive file to “Anyone with the link.” Direct private-file picking requires Google OAuth and Picker credentials.</p> : null}
        </div>
      ) : null}

      <input
        ref={deviceRef}
        type="file"
        accept="image/*,video/*"
        hidden
        onChange={(event) => {
          const selectedFile = event.target.files?.[0];
          if (selectedFile) routeFile(selectedFile);
          event.target.value = "";
        }}
      />
    </section>
  );
}
