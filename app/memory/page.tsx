"use client";

import {
  Eye,
  HeartPulse,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import PageIntro from "@/components/shared/PageIntro";
import {
  readStore,
  writeStore,
} from "@/lib/local-store";
import type { SavedAnalysis } from "@/types/analysis";

export default function MemoryPage() {
  const router = useRouter();

  const [items, setItems] = useState<SavedAnalysis[]>(
    () =>
      readStore<SavedAnalysis[]>(
        "plantverse-analyses",
        [],
      ),
  );

  function clearHistory() {
    writeStore("plantverse-analyses", []);
    setItems([]);
  }

  function deleteItem(id: string) {
    const updatedItems = items.filter(
      (item) => item.id !== id,
    );

    writeStore(
      "plantverse-analyses",
      updatedItems,
    );

    setItems(updatedItems);
  }

  function viewReport(item: SavedAnalysis) {
    writeStore(
      "plantverse-current-result",
      item,
    );

    router.push("/scan?view=saved");
  }

  return (
    <main className="page-wrap">
      <PageIntro
        eyebrow="Long-term intelligence"
        title="Plant Memory"
        description="Saved AI reports become a health timeline that helps compare progress and treatment response."
        action={
          items.length > 0 ? (
            <button
              type="button"
              onClick={clearHistory}
              className="outline-button"
            >
              <Trash2 size={17} />
              Clear history
            </button>
          ) : undefined
        }
      />

      {items.length === 0 ? (
        <div className="dashboard-panel mt-8 text-center">
          <div className="text-5xl">🧠</div>

          <h2 className="mt-4 text-xl font-semibold">
            No saved reports yet
          </h2>

          <p className="mt-2 text-[var(--text-secondary)]">
            Run Smart Scan and select Save to Plant
            Memory.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {items.map((item) => (
            <article
              key={item.id}
              className="dashboard-panel"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="eyebrow">
                    {item.scanType.replaceAll(
                      "-",
                      " ",
                    )}{" "}
                    analysis
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold">
                    {item.plantName ||
                      "Unknown Plant"}
                  </h2>

                  {item.localName ? (
                    <p className="mt-1 text-xl font-medium text-[var(--brand-primary)]">
                      {item.localName}
                    </p>
                  ) : null}

                  {item.scientificName ? (
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                      <span className="font-semibold not-italic">
                        Scientific Name:
                      </span>{" "}
                      <span className="italic">
                        {item.scientificName}
                      </span>
                    </p>
                  ) : null}
                </div>

                <div className="rounded-full bg-[var(--brand-soft)] px-3 py-1.5 text-sm font-semibold text-[var(--brand-primary)]">
                  {Math.round(
                    Number(item.healthScore) || 0,
                  )}
                  % health
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-[var(--surface-secondary)] p-4">
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <HeartPulse size={17} />
                    Condition
                  </div>

                  <p className="mt-2 font-semibold">
                    {item.disease || "Healthy"}
                  </p>
                </div>

                <div className="rounded-2xl bg-[var(--surface-secondary)] p-4">
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <Sparkles size={17} />
                    AI confidence
                  </div>

                  <p className="mt-2 font-semibold">
                    {Math.round(
                      Number(item.confidence) || 0,
                    )}
                    %
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm text-[var(--text-secondary)]">
                Saved{" "}
                {new Date(
                  item.createdAt,
                ).toLocaleString()}
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => viewReport(item)}
                  className="voice-button"
                >
                  <Eye size={17} />
                  View report
                </button>

                <button
                  type="button"
                  onClick={() =>
                    deleteItem(item.id)
                  }
                  className="outline-button text-red-600"
                >
                  <Trash2 size={17} />
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}