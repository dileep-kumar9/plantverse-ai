"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ANALYTICS_CONSENT_STORAGE_KEY } from "@/components/analytics/AnalyticsConsent";
import PageIntro from "@/components/shared/PageIntro";
import { useCollection } from "@/hooks/useCollection";

type Settings = {
  id: string;
  appLanguage: string;
  responseLanguage: string;
  plantLanguage: string;
  showEnglish: boolean;
  showScientific: boolean;
  selectedTranslate: boolean;
  readAloud: boolean;
  saveMemory: boolean;
  location: boolean;
  reminders: boolean;
  createdAt?: string;
};

const defaults: Omit<Settings, "id"> = {
  appLanguage: "English",
  responseLanguage: "English",
  plantLanguage: "Telugu",
  showEnglish: true,
  showScientific: true,
  selectedTranslate: true,
  readAloud: true,
  saveMemory: true,
  location: false,
  reminders: true,
};

export default function SettingsPage() {
  const { items, loading, create, update } = useCollection<Settings>("settings");
  const stored = items.find((item) => item.id === "main");
  const [settings, setSettings] = useState(defaults);
  const [message, setMessage] = useState("");
  const [analyticsConsent, setAnalyticsConsent] = useState<"granted" | "denied" | "unset">("unset");

  useEffect(() => {
    if (stored) setSettings({ ...defaults, ...stored });
    const consent = localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY);
    setAnalyticsConsent(consent === "granted" || consent === "denied" ? consent : "unset");
  }, [stored]);

  async function save(next: typeof settings) {
    setSettings(next);
    setMessage("Saving…");
    try {
      if (stored) await update("main", next);
      else await create({ id: "main", ...next, createdAt: new Date().toISOString() });
      setMessage("Saved");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save settings.");
    }
  }

  function patch<K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) {
    void save({ ...settings, [key]: value });
  }

  function changeAnalyticsConsent(value: "granted" | "denied") {
    localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, value);
    document.cookie = `pv_analytics_consent=${value}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    setAnalyticsConsent(value);
    window.location.reload();
  }

  const languageFields: Array<[keyof typeof settings, string]> = [
    ["appLanguage", "App language"],
    ["responseLanguage", "AI response language"],
    ["plantLanguage", "Plant-name language"],
  ];
  const featureFields: Array<[keyof typeof settings, string]> = [
    ["showEnglish", "Show English plant name"],
    ["showScientific", "Show scientific name"],
    ["selectedTranslate", "Translate selected text"],
    ["readAloud", "Read translations aloud"],
    ["saveMemory", "Allow saving scans to Plant Memory"],
    ["location", "Use precise location for live weather advice"],
    ["reminders", "Show care reminders"],
  ];

  return (
    <main className="page-wrap">
      <PageIntro eyebrow="Personalization" title="Settings" description="Settings are stored privately in your account and sync across devices." />
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="dashboard-panel">
          <h2 className="text-xl font-semibold">Language</h2>
          {languageFields.map(([key, label]) => (
            <label key={key} className="mt-5 block">{label}<select value={String(settings[key])} onChange={(event) => patch(key, event.target.value)} className="mt-2 w-full rounded-2xl border p-3"><option>English</option><option>Telugu</option><option>Hindi</option><option>Tamil</option><option>Kannada</option></select></label>
          ))}
        </section>
        <section className="dashboard-panel">
          <h2 className="text-xl font-semibold">Features & privacy</h2>
          {featureFields.map(([key, label]) => (
            <label key={key} className="mt-4 flex gap-3"><input type="checkbox" checked={Boolean(settings[key])} onChange={(event) => patch(key, event.target.checked)} />{label}</label>
          ))}
          <p className="mt-6 text-xs text-[var(--text-secondary)]">Location is requested by the browser only when live weather is enabled. PlantVerse does not store precise coordinates in this version.</p>
          <div className="mt-6 rounded-2xl border border-[var(--border-color)] p-4">
            <h3 className="font-semibold">Optional analytics</h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Current choice: {analyticsConsent}. Advertising storage remains disabled. See the <Link href="/cookies" className="underline">Cookie Policy</Link>.</p>
            <div className="mt-3 flex gap-2"><button type="button" className="outline-button" onClick={() => changeAnalyticsConsent("denied")}>Decline</button><button type="button" className="voice-button" onClick={() => changeAnalyticsConsent("granted")}>Allow analytics</button></div>
          </div>
          <p className="mt-3 text-sm">{loading ? "Loading…" : message}</p>
        </section>
      </div>
    </main>
  );
}
