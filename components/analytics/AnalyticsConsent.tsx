"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Consent = "granted" | "denied" | null;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export const ANALYTICS_CONSENT_STORAGE_KEY = "plantverse-analytics-consent";
const STORAGE_KEY = ANALYTICS_CONSENT_STORAGE_KEY;

function loadGoogleAnalytics(measurementId: string): void {
  if (document.getElementById("plantverse-google-analytics")) return;
  window.dataLayer = window.dataLayer ?? [];
  window.gtag = (...args: unknown[]) => window.dataLayer?.push(args);
  window.gtag("js", new Date());
  window.gtag("consent", "default", {
    analytics_storage: "granted",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  window.gtag("config", measurementId, {
    anonymize_ip: true,
    allow_google_signals: false,
    send_page_view: true,
  });

  const script = document.createElement("script");
  script.id = "plantverse-google-analytics";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);
}

export function trackAnalyticsEvent(
  name: string,
  parameters: Record<string, unknown> = {},
): void {
  if (localStorage.getItem(STORAGE_KEY) !== "granted") return;
  window.gtag?.("event", name, parameters);
}

export default function AnalyticsConsent() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const [consent, setConsent] = useState<Consent>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const next: Consent = stored === "granted" || stored === "denied" ? stored : null;
    setConsent(next);
    setReady(true);
    if (next === "granted" && measurementId) loadGoogleAnalytics(measurementId);
  }, [measurementId]);

  function decide(value: Exclude<Consent, null>) {
    localStorage.setItem(STORAGE_KEY, value);
    document.cookie = `pv_analytics_consent=${value}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    setConsent(value);
    if (value === "granted" && measurementId) loadGoogleAnalytics(measurementId);
    if (value === "denied") {
      window.gtag?.("consent", "update", { analytics_storage: "denied" });
    }
  }

  if (!ready || consent !== null || !measurementId) return null;

  return (
    <aside className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-3xl rounded-3xl border border-[var(--border-color)] bg-[var(--surface-primary)] p-4 shadow-[var(--shadow-lg)] sm:p-5" aria-label="Analytics consent">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-[var(--text-secondary)]">
          PlantVerse uses optional, privacy-conscious analytics to understand reliability and feature use. Advertising cookies are not enabled. Read the <Link href="/cookies" className="font-semibold text-[var(--brand-primary)] underline">Cookie Policy</Link>.
        </p>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => decide("denied")} className="outline-button">Decline</button>
          <button type="button" onClick={() => decide("granted")} className="voice-button">Allow analytics</button>
        </div>
      </div>
    </aside>
  );
}
