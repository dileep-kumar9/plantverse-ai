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

export type EvidenceKind =
  | "camera"
  | "device"
  | "web"
  | "drive";

type EvidencePickerProps = {
  onImageSelect: (file: File) => void;
  onVideoSelect: (file: File) => void;
  onVoiceComplete: (text: string) => void;
};

type SpeechRecognitionAlternativeLike = {
  transcript: string;
};

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
};

type SpeechRecognitionEventLike = {
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onstart: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop?: () => void;
  abort?: () => void;
};

type SpeechRecognitionConstructor =
  new () => SpeechRecognitionInstance;

type SpeechEnabledWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

const sources = [
  {
    id: "camera",
    label: "Open camera",
    description: "Capture a photo or record a video",
    icon: Camera,
  },
  {
    id: "device",
    label: "This device",
    description:
      "Choose a photo or video; PlantVerse detects it automatically",
    icon: HardDrive,
  },
  {
    id: "web",
    label: "Web link",
    description: "Import a public photo or video URL",
    icon: Globe2,
  },
  {
    id: "drive",
    label: "Google Drive",
    description:
      "Open Drive and paste a public photo or video link",
    icon: FolderOpen,
  },
] as const;

export default function EvidencePicker({
  onImageSelect,
  onVideoSelect,
  onVoiceComplete,
}: EvidencePickerProps) {
  const [open, setOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);

  const [urlMode, setUrlMode] = useState<
    "web" | "drive" | null
  >(null);

  const [remoteUrl, setRemoteUrl] = useState("");
  const [remoteError, setRemoteError] =
    useState<string | null>(null);
  const [remoteBusy, setRemoteBusy] = useState(false);
  const [listening, setListening] = useState(false);

  const deviceRef = useRef<HTMLInputElement | null>(null);
  const finalTranscriptRef = useRef("");
  const recognitionRef =
    useRef<SpeechRecognitionInstance | null>(null);

  function clearRemoteLink() {
    setRemoteUrl("");
    setRemoteError(null);
  }

  function closeUrlPanel() {
    clearRemoteLink();
    setUrlMode(null);
  }

  function routeFile(file: File) {
    setRemoteError(null);

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
    if (listening) {
      recognitionRef.current?.stop?.();
      return;
    }

    const speechWindow = window as SpeechEnabledWindow;

    const SpeechRecognition =
      speechWindow.SpeechRecognition ||
      speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      window.alert(
        "Speech recognition is not supported in this browser.",
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang =
      localStorage.getItem(
        "plantverse-speech-language",
      ) || "en-IN";

    recognition.interimResults = true;
    recognition.continuous = false;
    finalTranscriptRef.current = "";

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onerror = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    recognition.onresult = (
      event: SpeechRecognitionEventLike,
    ) => {
      const results = Array.from(event.results);

      const transcript = results
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();

      if (transcript) {
        finalTranscriptRef.current = transcript;
      }

      const lastResult = results.at(-1);

      if (transcript && lastResult?.isFinal) {
        finalTranscriptRef.current = "";
        setOpen(false);
        onVoiceComplete(transcript);
      }
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;

      const transcript =
        finalTranscriptRef.current.trim();

      if (transcript) {
        finalTranscriptRef.current = "";
        setOpen(false);
        onVoiceComplete(transcript);
      }
    };

    recognition.start();
  }

  async function importRemoteMedia() {
    const url = remoteUrl.trim();

    if (!url) {
      return;
    }

    setRemoteBusy(true);
    setRemoteError(null);

    try {
      const response = await fetch(
        "/api/import-image",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ url }),
        },
      );

      if (!response.ok) {
        const payload: unknown = await response
          .json()
          .catch(() => null);

        const message =
          payload &&
          typeof payload === "object" &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "Unable to import this media file.";

        throw new Error(message);
      }

      const blob = await response.blob();

      const type =
        blob.type || "application/octet-stream";

      const extension =
        type
          .split("/")[1]
          ?.replace("jpeg", "jpg")
          .replace("quicktime", "mov") || "bin";

      const file = new File(
        [blob],
        `imported-${Date.now()}.${extension}`,
        { type },
      );

      routeFile(file);
      closeUrlPanel();
      setOpen(false);
    } catch (error) {
      setRemoteError(
        error instanceof Error
          ? error.message
          : "Unable to import media.",
      );
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

    clearRemoteLink();
    setUrlMode(id);
    setOpen(false);
  }

  if (cameraOpen) {
    return (
      <CameraCapture
        onPhoto={(file) => {
          setCameraOpen(false);
          onImageSelect(file);
        }}
        onVideo={(file) => {
          setCameraOpen(false);
          onVideoSelect(file);
        }}
        onClose={() => setCameraOpen(false)}
      />
    );
  }

  return (
    <section className="relative">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <button
            type="button"
            onClick={() =>
              setOpen((currentValue) => !currentValue)
            }
            className="evidence-main-button"
            aria-expanded={open}
            aria-haspopup="menu"
          >
            <Upload size={20} />
            Add photo or video
            <ChevronDown size={18} />
          </button>

          {open ? (
            <div
              className="evidence-menu"
              role="menu"
            >
              {sources.map(
                ({
                  id,
                  label,
                  description,
                  icon: Icon,
                }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => chooseSource(id)}
                    className="evidence-menu-item"
                    role="menuitem"
                  >
                    <Icon
                      size={20}
                      className="shrink-0"
                    />

                    <span>
                      <span className="block">
                        {label}
                      </span>

                      <span className="mt-0.5 block text-xs font-normal text-[var(--text-secondary)]">
                        {description}
                      </span>
                    </span>
                  </button>
                ),
              )}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={startVoice}
          className={
            listening
              ? "voice-listening-button"
              : "evidence-voice-button"
          }
          aria-pressed={listening}
        >
          <Mic size={20} />

          {listening
            ? "Stop listening"
            : "Explain with voice"}
        </button>
      </div>

      <p className="mt-3 text-sm text-[var(--text-secondary)]">
        One device picker accepts both photos and videos.
        PlantVerse detects the file type and starts the
        correct inspection automatically.
      </p>

      {urlMode ? (
        <div className="mt-5 rounded-3xl border border-[var(--border-color)] bg-[var(--surface-secondary)] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">
                {urlMode === "drive"
                  ? "Import from Google Drive"
                  : "Import a public web link"}
              </h3>

              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Public image and video files are supported.
              </p>
            </div>

            <button
              type="button"
              onClick={closeUrlPanel}
              aria-label="Close link importer"
              title="Close"
              className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[var(--surface-hover)]"
            >
              <X size={18} />
            </button>
          </div>

          {urlMode === "drive" ? (
            <a
              href="https://drive.google.com/drive/my-drive"
              target="_blank"
              rel="noreferrer"
              className="outline-button mt-4 inline-flex"
            >
              <FolderOpen size={18} />
              Open Google Drive
            </a>
          ) : null}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <label className="relative flex min-h-12 flex-1 items-center gap-2 rounded-2xl border border-[var(--border-color)] bg-[var(--surface-primary)] px-4">
              <Link2
                size={18}
                className="shrink-0 text-[var(--text-secondary)]"
              />

              <input
                type="url"
                value={remoteUrl}
                onChange={(event) => {
                  setRemoteUrl(event.target.value);
                  setRemoteError(null);
                }}
                className="min-w-0 flex-1 bg-transparent pr-9 outline-none"
                placeholder={
                  urlMode === "drive"
                    ? "Paste a public Google Drive file link"
                    : "Paste a public image or video URL"
                }
                autoComplete="off"
              />

              {remoteUrl ? (
                <button
                  type="button"
                  onClick={clearRemoteLink}
                  aria-label="Remove pasted link"
                  title="Remove link"
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[var(--text-secondary)] transition hover:bg-[var(--surface-hover)] hover:text-red-600"
                >
                  <X size={17} />
                </button>
              ) : null}
            </label>

            <button
              type="button"
              onClick={() =>
                void importRemoteMedia()
              }
              disabled={
                remoteBusy || !remoteUrl.trim()
              }
              className="voice-button"
            >
              {remoteBusy
                ? "Importing…"
                : "Import & inspect"}
            </button>
          </div>

          {remoteError ? (
            <p
              className="mt-3 text-sm text-red-600"
              role="alert"
            >
              {remoteError}
            </p>
          ) : null}

          {urlMode === "drive" ? (
            <p className="mt-3 text-xs text-[var(--text-tertiary)]">
              Set the Drive file to “Anyone with the
              link.” Direct private-file picking requires
              Google OAuth and Picker credentials.
            </p>
          ) : null}
        </div>
      ) : null}

      <input
        ref={deviceRef}
        type="file"
        accept="image/*,video/*"
        hidden
        onChange={(event) => {
          const selectedFile =
            event.target.files?.[0];

          if (selectedFile) {
            routeFile(selectedFile);
          }

          event.target.value = "";
        }}
      />
    </section>
  );
}