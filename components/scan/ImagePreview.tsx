"use client";

type ImagePreviewProps = {
  file: File;
  previewUrl: string;
  onChangeImage: () => void;
  onRemove: () => void;
  onAnalyze: () => void;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ImagePreview({
  file,
  previewUrl,
  onChangeImage,
  onRemove,
  onAnalyze,
}: ImagePreviewProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-[var(--border-color)] bg-[var(--surface-primary)]">
      <div className="bg-[var(--surface-secondary)] p-4 sm:p-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl}
          alt="Selected scan preview"
          className="mx-auto max-h-[460px] w-full rounded-2xl object-contain"
        />
      </div>

      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="eyebrow">Selected image</p>

            <h2 className="mt-2 truncate text-lg font-semibold">
              {file.name}
            </h2>

            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {formatFileSize(file.size)} ·{" "}
              {file.type || "Image file"}
            </p>
          </div>

          <span className="self-start rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--brand-primary)]">
            Ready for analysis
          </span>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={onChangeImage}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--border-color)] px-5 py-2.5 text-sm font-semibold transition hover:border-[var(--brand-primary)] hover:bg-[var(--surface-hover)]"
          >
            Change image
          </button>

          <button
            type="button"
            onClick={onRemove}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
          >
            Remove
          </button>

          <button
            type="button"
            onClick={onAnalyze}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--brand-primary)] bg-[var(--brand-primary)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-secondary)] sm:ml-auto"
          >
            Analyze image
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </section>
  );
}