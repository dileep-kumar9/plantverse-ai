"use client";

import {
  ChevronDown,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import AnalysisResult from "@/components/scan/AnalysisResult";
import EvidencePicker from "@/components/scan/EvidencePicker";
import ProcessingPanel from "@/components/scan/ProcessingPanel";
import ScanStepper from "@/components/scan/ScanStepper";
import ScanTypeSelector from "@/components/scan/ScanTypeSelector";
import Card from "@/components/ui/Card";
import {
  inspectImageQuality,
  type ImageQualityReport,
} from "@/lib/image-quality";
import { getRecord } from "@/lib/client-api";
import type {
  AnalysisResult as AnalysisData,
  SavedAnalysis,
} from "@/types/analysis";
import {
  scanTypes,
  type ScanCategory,
  type ScanType,
} from "@/types/scan-wizard";

const spaces = [
  { id: "pot", label: "Pot" },
  { id: "terrace", label: "Terrace" },
  { id: "field", label: "Field" },
  { id: "empty-land", label: "Empty land" },
];

export default function ScanPageClient({
  reportId,
}: {
  reportId?: string;
}) {
  const router = useRouter();
  const [savedReport, setSavedReport] = useState<SavedAnalysis | null>(null);
  const [savedReportLoading, setSavedReportLoading] = useState(Boolean(reportId));
  const [savedReportError, setSavedReportError] = useState<string | null>(null);

  const [scanType, setScanType] =
    useState<ScanCategory | null>(null);
  const [space, setSpace] = useState("field");
  const [notes, setNotes] = useState("");
  const [file, setFile] =
    useState<File | null>(null);
  const [previewUrl, setPreviewUrl] =
    useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] =
    useState<string | null>(null);
  const [result, setResult] =
    useState<AnalysisData | null>(null);
  const [voiceQuestion, setVoiceQuestion] =
    useState("");
  const [voiceAnswer, setVoiceAnswer] =
    useState("");
  const [videoResult, setVideoResult] =
    useState<Record<string, unknown> | null>(
      null,
    );
  const [quality, setQuality] =
    useState<ImageQualityReport | null>(null);

  const selectedType = useMemo(
    () =>
      scanTypes.find(
        (item) => item.id === scanType,
      ) ?? null,
    [scanType],
  );

  useEffect(() => {
    if (!reportId) return;
    let active = true;
    setSavedReportLoading(true);
    setSavedReportError(null);
    void getRecord<SavedAnalysis>("analyses", reportId)
      .then((record) => {
        if (!active) return;
        setSavedReport(record);
        if (!record) setSavedReportError("Saved report not found.");
      })
      .catch((requestError) => {
        if (active) setSavedReportError(requestError instanceof Error ? requestError.message : "Unable to load report.");
      })
      .finally(() => {
        if (active) setSavedReportLoading(false);
      });
    return () => {
      active = false;
    };
  }, [reportId]);

  useEffect(
    () => () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    },
    [previewUrl],
  );

  function clearEvidence() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setVideoResult(null);
    setError(null);
    setVoiceQuestion("");
    setVoiceAnswer("");
    setQuality(null);
  }

  function clearSavedReportAndReturn() {
    router.replace("/scan");
  }

  function chooseAnalysis(scan: ScanType) {
    setScanType(scan.id);
    clearEvidence();
  }

  async function analyzeImage(
    selectedFile: File,
  ) {
    if (!scanType) {
      return;
    }

    setBusy(true);
    setError(null);
    setFile(selectedFile);

    const qualityReport =
      await inspectImageQuality(selectedFile);

    setQuality(qualityReport);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(
      URL.createObjectURL(selectedFile),
    );

    try {
      const formData = new FormData();

      formData.append("image", selectedFile);
      formData.append("scanType", scanType);
      formData.append(
        "growingSpace",
        space,
      );
      formData.append("notes", notes);

      const response = await fetch(
        "/api/analyze",
        {
          method: "POST",
          body: formData,
        },
      );

      const data: {
        result?: AnalysisData;
        error?: string;
      } = await response.json();

      if (!response.ok || !data.result) {
        throw new Error(
          data.error || "Analysis failed.",
        );
      }

      setResult(data.result);

      window.sessionStorage.setItem(
        "plantverse-current-result",
        JSON.stringify(data.result),
      );
    } catch (analysisError) {
      setError(
        analysisError instanceof Error
          ? analysisError.message
          : "Analysis failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function analyzeVideo(video: File) {
    if (!scanType) {
      return;
    }

    setBusy(true);
    setError(null);
    setVideoResult(null);

    try {
      const formData = new FormData();

      formData.append("video", video);
      formData.append("scanType", scanType);
      formData.append(
        "narration",
        notes,
      );

      const response = await fetch(
        "/api/video-analyze",
        {
          method: "POST",
          body: formData,
        },
      );

      const data: {
        result?: Record<string, unknown>;
        error?: string;
      } = await response.json();

      if (!response.ok || !data.result) {
        throw new Error(
          data.error ||
            "Video analysis failed.",
        );
      }

      setVideoResult(data.result);

      window.sessionStorage.setItem(
        "plantverse-current-video-result",
        JSON.stringify(data.result),
      );
    } catch (analysisError) {
      setError(
        analysisError instanceof Error
          ? analysisError.message
          : "Video analysis failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function searchVoice(
    transcript: string,
  ) {
    setVoiceQuestion(transcript);
    setVoiceAnswer("Searching…");
    setError(null);

    try {
      let previousResult: AnalysisData | null = result;
      if (!previousResult) {
        try {
          previousResult = JSON.parse(
            window.sessionStorage.getItem("plantverse-current-result") || "null",
          ) as AnalysisData | null;
        } catch {
          previousResult = null;
        }
      }

      const response = await fetch(
        "/api/assistant",
        {
          method: "POST",
          headers: {
            "content-type":
              "application/json",
          },
          body: JSON.stringify({
            message: transcript,
            context: {
              scanType,
              growingSpace: space,
              notes,
              previousResult,
            },
          }),
        },
      );

      const data: {
        reply?: string;
        error?: string;
      } = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Voice search failed.",
        );
      }

      setVoiceAnswer(
        data.reply ||
          "No answer was returned.",
      );
    } catch (voiceError) {
      setVoiceAnswer("");

      setError(
        voiceError instanceof Error
          ? voiceError.message
          : "Voice search failed.",
      );
    }
  }

  const currentStep =
    result || videoResult
      ? 4
      : busy
        ? 3
        : scanType
          ? 2
          : 1;

  if (reportId && savedReportLoading) {
    return (
      <main className="page-wrap">
        <div className="dashboard-panel mt-8">Loading saved report…</div>
      </main>
    );
  }

  if (reportId && savedReportError) {
    return (
      <main className="page-wrap">
        <div className="dashboard-panel mt-8">
          <p className="font-semibold">Unable to open report</p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">{savedReportError}</p>
          <button type="button" onClick={clearSavedReportAndReturn} className="outline-button mt-5">Back to Smart Scan</button>
        </div>
      </main>
    );
  }

  if (reportId && savedReport) {
    return (
      <main className="page-wrap">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[var(--border-color)] bg-[var(--surface-primary)] p-5">
          <div>
            <p className="eyebrow">
              Viewing saved report
            </p>

            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Saved{" "}
              {new Date(
                savedReport.createdAt,
              ).toLocaleString()}
            </p>
          </div>

          <button
            type="button"
            onClick={
              clearSavedReportAndReturn
            }
            className="outline-button"
          >
            Back to Smart Scan
          </button>
        </div>

        <ScanStepper currentStep={4} />

        <AnalysisResult
          result={savedReport}
          scanType={savedReport.scanType}
          imageName={savedReport.imageName}
          onReset={clearSavedReportAndReturn}
          savedId={savedReport.id}
        />
      </main>
    );
  }

  if (result && scanType) {
    return (
      <main className="page-wrap">
        <ScanStepper currentStep={4} />

        <AnalysisResult
          result={result}
          scanType={scanType}
          imageName={file?.name}
          onReset={() => {
            clearEvidence();
            setNotes("");
          }}
        />
      </main>
    );
  }

  return (
    <main className="page-wrap">
      <div>
        <p className="eyebrow">
          PlantVerse Smart Scan
        </p>

        <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">
          One analysis. One evidence button.
          Clear results.
        </h1>

        <p className="mt-3 max-w-3xl text-[var(--text-secondary)]">
          Choose the analysis once. Then
          capture, upload, paste, record, or
          speak. PlantVerse automatically
          starts the matching AI inspection.
        </p>
      </div>

      <Card className="mt-8">
        <ScanStepper
          currentStep={currentStep}
        />
      </Card>

      {!scanType ? (
        <section className="mt-8">
          <ScanTypeSelector
            selectedType={null}
            onSelect={chooseAnalysis}
          />
        </section>
      ) : (
        <section className="mt-8 grid gap-6 lg:grid-cols-[0.34fr_0.66fr]">
          <aside className="dashboard-panel h-fit">
            <div className="flex items-start gap-4">
              <span
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl"
                style={{
                  backgroundColor: `${selectedType?.accent}18`,
                }}
              >
                {selectedType?.icon}
              </span>

              <div className="min-w-0">
                <p className="eyebrow">
                  Selected analysis
                </p>

                <h2 className="mt-1 text-2xl font-semibold">
                  {selectedType?.title}
                </h2>

                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  {selectedType?.description}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="mt-5 text-sm font-semibold text-[var(--brand-primary)]"
              onClick={() => {
                setScanType(null);
                clearEvidence();
              }}
            >
              Change analysis
            </button>

            <label className="relative mt-6 block">
              <span className="mb-2 block text-sm font-semibold">
                Growing context
              </span>

              <select
                value={space}
                onChange={(event) =>
                  setSpace(event.target.value)
                }
                className="min-h-12 w-full appearance-none rounded-2xl border border-[var(--border-color)] bg-[var(--surface-secondary)] px-4 pr-10 outline-none"
              >
                {spaces.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.label}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={17}
                className="pointer-events-none absolute bottom-4 right-4 text-[var(--text-secondary)]"
              />
            </label>

            <label className="mt-5 block">
              <span className="text-sm font-semibold">
                Optional explanation
              </span>

              <textarea
                value={notes}
                onChange={(event) =>
                  setNotes(event.target.value)
                }
                rows={4}
                className="mt-2 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--surface-secondary)] p-4 outline-none focus:border-[var(--brand-primary)]"
                placeholder="Symptoms, watering, sunlight, land size, meter reading, or what you need…"
              />
            </label>
          </aside>

          <div className="dashboard-panel">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="eyebrow">
                  Add evidence
                </p>

                <h2 className="mt-1 text-2xl font-semibold">
                  Use one simple evidence
                  control
                </h2>
              </div>

              {file ||
              videoResult ||
              voiceQuestion ? (
                <button
                  type="button"
                  onClick={clearEvidence}
                  className="outline-button"
                >
                  <RotateCcw size={17} />
                  Start over
                </button>
              ) : null}
            </div>

            {error ? (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="mt-6">
              <EvidencePicker
                onImageSelect={(
                  selectedFile,
                ) =>
                  void analyzeImage(
                    selectedFile,
                  )
                }
                onVideoSelect={(video) =>
                  void analyzeVideo(video)
                }
                onVoiceComplete={(
                  transcript,
                ) =>
                  void searchVoice(
                    transcript,
                  )
                }
              />
            </div>

            {previewUrl ? (
              <div className="mt-6 overflow-hidden rounded-3xl border border-[var(--border-color)] bg-[var(--surface-secondary)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Evidence preview"
                  className="max-h-[430px] w-full object-contain"
                />
              </div>
            ) : null}

            {quality?.warnings.length ? (
              <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                <h3 className="font-semibold">
                  Image quality suggestions
                </h3>

                <ul className="mt-3 space-y-2 text-sm">
                  {quality.warnings.map(
                    (warning) => (
                      <li key={warning}>
                        • {warning}
                      </li>
                    ),
                  )}
                </ul>

                <p className="mt-3 text-xs opacity-75">
                  PlantVerse continued the
                  inspection, but a clearer image
                  may improve confidence.
                </p>
              </div>
            ) : null}

            {busy ? (
              <ProcessingPanel
                analysisName={
                  selectedType?.title ||
                  "evidence"
                }
              />
            ) : null}

            {voiceQuestion ? (
              <div className="mt-6 rounded-3xl border border-[var(--border-color)] p-5">
                <div className="flex items-center gap-2 font-semibold">
                  <Sparkles
                    size={18}
                    className="text-[var(--brand-primary)]"
                  />
                  Voice search completed
                  automatically
                </div>

                <p className="mt-3 text-sm text-[var(--text-secondary)]">
                  “{voiceQuestion}”
                </p>

                {voiceAnswer ? (
                  <div className="mt-4 rounded-2xl bg-[var(--surface-secondary)] p-4 text-sm leading-7">
                    {voiceAnswer}
                  </div>
                ) : null}
              </div>
            ) : null}

            {videoResult ? (
              <div className="mt-6 rounded-3xl border border-[var(--border-color)] p-5">
                <h3 className="font-semibold">
                  Video inspection result
                </h3>

                <div className="mt-4 grid gap-3 text-sm">
                  {Object.entries(
                    videoResult,
                  ).map(([key, value]) => (
                    <div
                      key={key}
                      className="rounded-2xl bg-[var(--surface-secondary)] p-4"
                    >
                      <p className="font-semibold capitalize">
                        {key.replaceAll(
                          "_",
                          " ",
                        )}
                      </p>

                      <p className="mt-2 whitespace-pre-wrap text-[var(--text-secondary)]">
                        {Array.isArray(value)
                          ? value.join("\n• ")
                          : String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      )}
    </main>
  );
}