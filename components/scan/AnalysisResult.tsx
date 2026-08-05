"use client";

import {
  Bot,
  CalendarPlus,
  Languages,
  Printer,
  RotateCcw,
  Save,
  ShoppingBag,
} from "lucide-react";
import { useState } from "react";

import { createRecord } from "@/lib/client-api";
import type {
  AnalysisResult,
  SavedAnalysis,
} from "@/types/analysis";

function Metric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  const safeValue = Math.max(
    0,
    Math.min(100, Math.round(value || 0)),
  );

  return (
    <div className="rounded-2xl bg-white/10 p-4">
      <div className="flex items-end justify-between gap-3">
        <span className="text-sm text-white/65">
          {label}
        </span>

        <strong className="text-2xl">
          {safeValue}%
        </strong>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15">
        <div
          className="h-full rounded-full bg-white"
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}

function ListCard({
  title,
  values,
  tone = "normal",
}: {
  title: string;
  values?: unknown;
  tone?: "normal" | "warning" | "success";
}) {
  const items = Array.isArray(values)
    ? values
        .map((value) => String(value).trim())
        .filter(Boolean)
    : typeof values === "string" && values.trim()
      ? [values.trim()]
      : values && typeof values === "object"
        ? Object.values(values)
            .flatMap((value) =>
              Array.isArray(value) ? value : [value],
            )
            .map((value) => String(value).trim())
            .filter(Boolean)
        : [];

  if (items.length === 0) {
    return null;
  }

  const toneClass =
    tone === "warning"
      ? "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950"
      : tone === "success"
        ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
        : "border-[var(--border-color)] bg-[var(--surface-primary)]";

  return (
    <section
      className={`rounded-3xl border p-5 ${toneClass}`}
    >
      <h3 className="font-semibold">
        {title}
      </h3>

      <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--text-secondary)]">
        {items.map((value, index) => (
          <li
            key={`${title}-${index}-${value}`}
            className="flex gap-2"
          >
            <span className="text-[var(--brand-primary)]">
              ✓
            </span>

            <span>{value}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function AnalysisResult({
  result,
  scanType,
  imageName,
  onReset,
  savedId,
}: {
  result: AnalysisResult;
  scanType: string;
  imageName?: string;
  onReset: () => void;
  savedId?: string;
}) {
  const [growingSpace, setGrowingSpace] =
    useState(
      result.growingSpace || "field",
    );

  const [saved, setSaved] = useState(Boolean(savedId));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function saveAnalysis() {
    if (saved || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const item: Omit<SavedAnalysis, "id"> = {
        ...result,
        growingSpace,
        scanType,
        imageName,
        createdAt: new Date().toISOString(),
      };
      const created = await createRecord("analyses", item as unknown as Record<string, unknown>);
      window.sessionStorage.setItem("plantverse-current-result", JSON.stringify(created));
      setSaved(true);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to save this report.");
    } finally {
      setSaving(false);
    }
  }

  function goTo(path: string) {
    window.sessionStorage.setItem(
      "plantverse-current-result",
      JSON.stringify({ ...result, growingSpace }),
    );
    window.location.href = path;
  }

  return (
    <section className="mt-8 pb-28">
      <div className="rounded-[2rem] bg-gradient-to-br from-green-950 via-green-800 to-green-600 p-6 text-white shadow-[var(--shadow-lg)] sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.7fr] lg:items-start">
          <div>
            <p className="text-sm uppercase tracking-wider text-white/70">
              {scanType.replaceAll("-", " ")} analysis
              report
            </p>

            <h1 className="mt-2 text-4xl font-bold leading-tight sm:text-5xl">
              {result.plantName ||
                "Unknown Plant"}
            </h1>

            {result.localName ? (
              <p className="mt-2 text-2xl font-medium text-green-100">
                {result.localName}
              </p>
            ) : null}

            {result.scientificName ? (
              <p className="mt-3 text-base text-white/75">
                <span className="font-semibold not-italic">
                  Scientific Name:
                </span>{" "}
                <span className="italic">
                  {result.scientificName}
                </span>
              </p>
            ) : null}

            <div className="mt-6 rounded-2xl bg-white/10 p-4">
              <p className="text-xl font-semibold">
                {result.disease ||
                  "Healthy"}
              </p>

              <p className="mt-2 capitalize text-white/70">
                Severity:{" "}
                {result.severity ||
                  "Unknown"}{" "}
                · Scene:{" "}
                {result.scene ||
                  "Not specified"}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <Metric
              label="Health score"
              value={result.healthScore}
            />

            <Metric
              label="AI confidence"
              value={result.confidence}
            />
          </div>
        </div>

        {result.roadOrNonGrowingSurface ? (
          <div className="mt-5 rounded-2xl bg-amber-300/20 p-4">
            This appears to be a road or another
            non-growing surface. Select a suitable
            growing area before applying plant
            recommendations.
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {[
          "pot",
          "terrace",
          "field",
          "empty-land",
        ].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() =>
              setGrowingSpace(item)
            }
            className={
              growingSpace === item
                ? "voice-button"
                : "outline-button"
            }
          >
            {item.replace("-", " ")}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <ListCard
          title="Visible observations"
          values={result.symptoms}
        />

        <ListCard
          title="Possible causes"
          values={result.possibleCauses}
          tone="warning"
        />

        <ListCard
          title="Treatment and next steps"
          values={result.treatment}
          tone="success"
        />

        <ListCard
          title="Prevention"
          values={result.prevention}
        />

        <ListCard
          title="Soil improvement"
          values={result.soilImprovement}
        />

        <ListCard
          title="Suitable plants"
          values={result.suitablePlants}
        />

        <ListCard
          title="Fertilizer options"
          values={
            result.fertilizerSuggestions
          }
        />

        <ListCard
          title="Pesticide / IPM options"
          values={
            result.pesticideSuggestions
          }
          tone="warning"
        />

        <ListCard
          title="More evidence requested"
          values={result.evidenceNeeded}
          tone="warning"
        />
      </div>

      {result.wateringAdvice ? (
        <div className="dashboard-panel mt-5">
          <h3 className="font-semibold">
            Watering advice
          </h3>

          <p className="mt-2 text-[var(--text-secondary)]">
            {result.wateringAdvice}
          </p>

          {result.moistureNote ? (
            <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">
              {result.moistureNote}
            </p>
          ) : null}
        </div>
      ) : null}

      {result.disclaimer ? (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          {result.disclaimer}
        </div>
      ) : null}

      {saveError ? (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{saveError}</div>
      ) : null}

      <div className="sticky bottom-4 z-20 mt-6 flex flex-wrap gap-3 rounded-3xl border border-[var(--border-color)] bg-[var(--surface-primary)]/95 p-4 shadow-[var(--shadow-lg)] backdrop-blur-xl">
        <button
          type="button"
          onClick={() => void saveAnalysis()}
          disabled={saved || saving}
          className="voice-button disabled:opacity-60"
        >
          <Save size={17} />

          {saved ? "Saved" : saving ? "Saving…" : "Save to Memory"}
        </button>

        <button
          type="button"
          onClick={() =>
            goTo("/translator")
          }
          className="outline-button"
        >
          <Languages size={17} />
          Translate
        </button>

        <button
          type="button"
          onClick={() =>
            goTo("/assistant")
          }
          className="outline-button"
        >
          <Bot size={17} />
          Ask AI
        </button>

        <button
          type="button"
          onClick={() =>
            goTo("/marketplace")
          }
          className="outline-button"
        >
          <ShoppingBag size={17} />
          Products
        </button>

        <button
          type="button"
          onClick={() =>
            goTo("/planner")
          }
          className="outline-button"
        >
          <CalendarPlus size={17} />
          Add task
        </button>

        <button
          type="button"
          onClick={() =>
            window.print()
          }
          className="outline-button"
        >
          <Printer size={17} />
          PDF
        </button>

        <button
          type="button"
          onClick={onReset}
          className="outline-button"
        >
          <RotateCcw size={17} />
          New scan
        </button>
      </div>
    </section>
  );
}