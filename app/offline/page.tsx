import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Offline",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl items-center px-4 py-16">
      <section className="dashboard-panel w-full text-center">
        <div className="text-5xl" aria-hidden="true">🌱</div>
        <h1 className="mt-5 text-3xl font-semibold">You are offline</h1>
        <p className="mt-3 text-[var(--text-secondary)]">
          PlantVerse needs a connection for AI analysis and cloud records. Reconnect and try again.
        </p>
        <Link href="/" className="voice-button mt-6">Return to PlantVerse</Link>
      </section>
    </main>
  );
}
