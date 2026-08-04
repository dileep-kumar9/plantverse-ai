import { Suspense } from "react";

import ScanPageClient from "./ScanPageClient";

function ScanPageFallback() {
  return (
    <main className="page-wrap">
      <div className="dashboard-panel">
        <p className="eyebrow">PlantVerse Smart Scan</p>

        <h1 className="mt-2 text-3xl font-semibold">
          Loading Smart Scan…
        </h1>

        <p className="mt-3 text-[var(--text-secondary)]">
          Preparing your scan workspace.
        </p>
      </div>
    </main>
  );
}

export default function ScanPage() {
  return (
    <Suspense fallback={<ScanPageFallback />}>
      <ScanPageClient />
    </Suspense>
  );
}