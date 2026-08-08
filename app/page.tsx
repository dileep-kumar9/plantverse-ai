import type { Metadata } from "next";
import {
  BrainCircuit,
  Camera,
  CloudSun,
  Leaf,
  LineChart,
  Sprout,
} from "lucide-react";
import Link from "next/link";

import PwaInstallButton from "@/components/pwa/PwaInstallButton";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Plant health, soil guidance and grow planning",
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: `${SITE_NAME} — Plant health, soil guidance and grow planning`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
  },
};

const features = [
  {
    icon: Camera,
    title: "Smart Scan",
    text: "Use photos to get AI-assisted observations for plants, leaves, flowers, fruit, soil and pests.",
  },
  {
    icon: Sprout,
    title: "Grow Planner",
    text: "Plan pots, terraces, fields and custom spaces with plant suggestions and practical measurements.",
  },
  {
    icon: Leaf,
    title: "My Plants",
    text: "Keep your plant records, notes and health information together in your private account.",
  },
  {
    icon: BrainCircuit,
    title: "AI plant workspace",
    text: "Ask follow-up questions, translate guidance and keep useful garden context in one place.",
  },
  {
    icon: CloudSun,
    title: "Weather-aware care",
    text: "Bring weather, reminders and plant-care planning into the same gardening dashboard.",
  },
  {
    icon: LineChart,
    title: "Track garden progress",
    text: "Review recent activity, scans, tasks and plant health from your personal dashboard.",
  },
] as const;

export default function PublicHomePage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
      },
      {
        "@type": "WebApplication",
        name: SITE_NAME,
        url: SITE_URL,
        applicationCategory: "LifestyleApplication",
        operatingSystem: "Web, Android, iOS, Windows, macOS",
        description: SITE_DESCRIPTION,
      },
    ],
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <section className="relative overflow-hidden border-b border-[var(--border-color)]">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
          <div className="animate-fade-in-up">
            <p className="eyebrow">Plant care, planning and records</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl lg:text-6xl">
              Grow with better context using PlantVerse AI.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-[var(--text-secondary)] sm:text-lg">
              PlantVerse AI combines photo-assisted plant analysis, soil guidance, grow planning, reminders and private plant records in one gardening workspace.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className="voice-button tap-scale">Create free account</Link>
              <Link href="/login" className="outline-button tap-scale">Sign in</Link>
            </div>
            <div className="mt-4">
              <PwaInstallButton />
            </div>
          </div>

          <div className="hero-panel animate-fade-in-up overflow-hidden rounded-[2rem] p-6 text-white sm:p-8" style={{ animationDelay: "120ms" }}>
            <div className="relative z-10">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/15 text-3xl">🌿</div>
              <h2 className="mt-7 text-2xl font-semibold">One workspace for your garden</h2>
              <p className="mt-3 leading-7 text-white/80">
                Scan a plant, plan a growing space, save what matters and return to your garden history from any supported browser.
              </p>
              <div className="stagger-children mt-7 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 transition-transform duration-200 hover:-translate-y-0.5">📷 Smart Scan</div>
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 transition-transform duration-200 hover:-translate-y-0.5">🌾 Grow Planner</div>
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 transition-transform duration-200 hover:-translate-y-0.5">🌱 My Plants</div>
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 transition-transform duration-200 hover:-translate-y-0.5">⏰ Reminders</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20" aria-labelledby="features-heading">
        <div className="max-w-2xl">
          <p className="eyebrow">What PlantVerse includes</p>
          <h2 id="features-heading" className="section-title text-3xl sm:text-4xl">Useful tools from scan to harvest</h2>
          <p className="mt-4 leading-7 text-[var(--text-secondary)]">
            The public site explains PlantVerse to search engines and visitors. Your personal dashboard and cloud records remain behind sign-in.
          </p>
        </div>
        <div className="stagger-children mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <article key={title} className="feature-card">
              <span className="feature-icon feature-icon-green"><Icon size={22} /></span>
              <h3 className="mt-5 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[var(--border-color)] bg-[var(--surface-secondary)]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="eyebrow">Install without an app store</p>
              <h2 className="mt-2 text-2xl font-semibold">Use PlantVerse as an installable web app</h2>
              <p className="mt-3 max-w-3xl leading-7 text-[var(--text-secondary)]">
                PlantVerse can be added to a phone or desktop home screen as a Progressive Web App. The same production website supplies the latest web experience.
              </p>
            </div>
            <span className="inline-flex min-h-12 max-w-md items-center rounded-2xl border border-[var(--border-color)] bg-[var(--surface-primary)] px-4 text-sm text-[var(--text-secondary)]">
              Install from your browser menu on supported devices; no app-store account is required for the PWA.
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="rounded-[2rem] border border-[var(--border-color)] bg-[var(--surface-primary)] p-6 shadow-[var(--shadow-soft)] sm:p-9">
          <h2 className="text-2xl font-semibold">Designed with privacy boundaries</h2>
          <p className="mt-3 max-w-3xl leading-7 text-[var(--text-secondary)]">
            Public product information can be indexed by search engines, while account dashboards, personal plant records, profile data and administrative routes stay protected.
          </p>
          <div className="mt-5 flex flex-wrap gap-4 text-sm font-semibold text-[var(--brand-primary)]">
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/safety">AI Safety</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
