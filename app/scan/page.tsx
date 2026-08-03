"use client";

import { useEffect, useRef, useState } from "react";

import ImagePreview from "@/components/scan/ImagePreview";
import ImageUploader from "@/components/scan/ImageUploader";
import InputMethodSelector from "@/components/scan/InputMethodSelector";
import ScanStepper from "@/components/scan/ScanStepper";
import ScanTypeSelector from "@/components/scan/ScanTypeSelector";
import Card from "@/components/ui/Card";

import type {
  InputMethod,
  ScanCategory,
  ScanType,
} from "@/types/scan-wizard";

export default function ScanPage() {
  const [selectedType, setSelectedType] =
    useState<ScanCategory | null>(null);

  const [selectedMethod, setSelectedMethod] =
    useState<InputMethod | null>(null);

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [previewUrl, setPreviewUrl] =
    useState<string | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] =
    useState<string | null>(null);

  const hiddenInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function clearSelectedImage() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(null);
    setPreviewUrl(null);
    setAnalysisError(null);
  }

  function handleScanTypeSelect(scanType: ScanType) {
    setSelectedType(scanType.id);
    setSelectedMethod(null);
    clearSelectedImage();
  }

  function handleMethodSelect(method: InputMethod) {
    setSelectedMethod(method);
    clearSelectedImage();
  }

  function handleImageSelect(file: File) {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setAnalysisError(null);
  }

  async function handleAnalyze() {
    if (!selectedFile || !selectedType) {
      return;
    }

    try {
      setIsAnalyzing(true);
      setAnalysisError(null);

      const formData = new FormData();

      formData.append("image", selectedFile);
      formData.append("scanType", selectedType);

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed.");
      }

      console.log("PlantVerse analysis result:", data);

      window.alert(
        "Analysis completed successfully. The result is available in the browser console.",
      );
    } catch (error) {
      console.error("Plant analysis failed:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Plant analysis failed. Please try again.";

      setAnalysisError(message);
    } finally {
      setIsAnalyzing(false);
    }
  }

  const currentStep = selectedFile
    ? 3
    : selectedType
      ? 2
      : 1;

  const supportsImageUpload =
    selectedMethod === "gallery" ||
    selectedMethod === "camera";

  return (
    <main className="min-h-screen bg-[var(--app-background)] px-4 py-8 text-[var(--text-primary)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          PlantVerse Smart Scan
        </h1>

        <p className="mt-3 max-w-2xl text-[var(--text-secondary)]">
          Choose what you want to inspect, select an input method, and preview
          the evidence before starting AI analysis.
        </p>

        <Card className="mt-8">
          <ScanStepper currentStep={currentStep} />
        </Card>

        <section className="mt-10">
          {!selectedType ? (
            <ScanTypeSelector
              selectedType={selectedType}
              onSelect={handleScanTypeSelect}
            />
          ) : !selectedMethod ? (
            <>
              <div className="mb-6 rounded-3xl border border-[var(--border-color)] bg-[var(--surface-primary)] p-5">
                <p className="text-sm text-[var(--text-secondary)]">
                  Selected analysis
                </p>

                <h2 className="mt-2 text-2xl font-semibold capitalize">
                  {selectedType}
                </h2>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedType(null);
                    setSelectedMethod(null);
                    clearSelectedImage();
                  }}
                  className="mt-4 text-sm font-semibold text-[var(--brand-primary)]"
                >
                  ← Change scan type
                </button>
              </div>

              <InputMethodSelector
                selectedMethod={selectedMethod}
                onSelect={handleMethodSelect}
              />
            </>
          ) : supportsImageUpload ? (
            <>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Selected input
                  </p>

                  <h2 className="mt-1 text-2xl font-semibold capitalize">
                    {selectedMethod}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedMethod(null);
                    clearSelectedImage();
                  }}
                  className="text-sm font-semibold text-[var(--brand-primary)]"
                >
                  Change input method
                </button>
              </div>

              {analysisError ? (
                <div
                  role="alert"
                  className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
                >
                  {analysisError}
                </div>
              ) : null}

              {selectedFile && previewUrl ? (
                <div className="relative">
                  <ImagePreview
                    file={selectedFile}
                    previewUrl={previewUrl}
                    onChangeImage={() =>
                      hiddenInputRef.current?.click()
                    }
                    onRemove={clearSelectedImage}
                    onAnalyze={handleAnalyze}
                  />

                  {isAnalyzing ? (
                    <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-black/45 p-6 backdrop-blur-sm">
                      <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center text-gray-900 shadow-2xl">
                        <div
                          className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-green-200 border-t-green-600"
                          aria-hidden="true"
                        />

                        <h3 className="mt-5 text-xl font-semibold">
                          Analyzing image
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-gray-600">
                          PlantVerse AI is checking the image and preparing a
                          structured report.
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <ImageUploader onImageSelect={handleImageSelect} />
              )}

              <input
                ref={hiddenInputRef}
                type="file"
                accept="image/*"
                capture={
                  selectedMethod === "camera"
                    ? "environment"
                    : undefined
                }
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0];

                  if (file) {
                    handleImageSelect(file);
                  }

                  event.target.value = "";
                }}
              />
            </>
          ) : (
            <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--surface-primary)] p-8 text-center">
              <div className="text-5xl">
                {selectedMethod === "video" ? "🎥" : "🎤"}
              </div>

              <h2 className="mt-5 text-2xl font-semibold capitalize">
                {selectedMethod} input
              </h2>

              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
                The video and voice recording interfaces will be connected in
                the next step.
              </p>

              <button
                type="button"
                onClick={() => setSelectedMethod(null)}
                className="mt-6 text-sm font-semibold text-[var(--brand-primary)]"
              >
                ← Change input method
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
