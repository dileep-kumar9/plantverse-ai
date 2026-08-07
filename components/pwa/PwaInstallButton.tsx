"use client";

import { Download } from "lucide-react";
import { useEffect, useState } from "react";

type InstallChoice = {
  outcome: "accepted" | "dismissed";
  platform: string;
};

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<InstallChoice>;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

export default function PwaInstallButton() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());

    function capturePrompt(event: Event) {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    }

    function handleInstalled() {
      setInstalled(true);
      setPromptEvent(null);
    }

    window.addEventListener("beforeinstallprompt", capturePrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", capturePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function install() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setPromptEvent(null);
  }

  if (installed) {
    return (
      <span className="inline-flex min-h-12 items-center rounded-full border border-[var(--border-color)] bg-[var(--surface-primary)] px-5 text-sm font-semibold text-[var(--text-secondary)]">
        PlantVerse is installed
      </span>
    );
  }

  if (!promptEvent) {
    return (
      <span className="inline-flex min-h-12 max-w-md items-center rounded-2xl border border-[var(--border-color)] bg-[var(--surface-primary)] px-4 text-sm text-[var(--text-secondary)]">
        On Android/Chrome use the browser menu → Install app. On iPhone/Safari use Share → Add to Home Screen.
      </span>
    );
  }

  return (
    <button type="button" onClick={() => void install()} className="voice-button">
      <Download size={18} />
      Install PlantVerse
    </button>
  );
}
