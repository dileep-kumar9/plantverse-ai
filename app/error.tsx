"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("PlantVerse page error", error);
  }, [error]);

  return (
    <main className="page-wrap">
      <div className="dashboard-panel text-center">
        <p className="eyebrow">Something went wrong</p>
        <h1 className="mt-3 text-3xl font-semibold">This page could not be loaded</h1>
        <p className="mt-3 text-[var(--text-secondary)]">Your saved account data has not been changed. Try the request again.</p>
        <button type="button" onClick={reset} className="voice-button mt-6">Try again</button>
      </div>
    </main>
  );
}
