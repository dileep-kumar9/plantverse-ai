"use client";

import { ChangeEvent } from "react";

type ImageUploaderProps = {
  onImageSelect: (file: File) => void;
};

export default function ImageUploader({
  onImageSelect,
}: ImageUploaderProps) {
  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    onImageSelect(file);
  }

  return (
    <label
      htmlFor="plant-image"
      className="flex min-h-80 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[var(--border-color)] bg-[var(--surface-primary)] p-8 text-center transition hover:border-[var(--brand-primary)] hover:bg-[var(--brand-soft)]/30"
    >
      <div className="text-6xl">📷</div>

      <h3 className="mt-6 text-2xl font-semibold">
        Upload Plant Image
      </h3>

      <p className="mt-3 max-w-md text-sm text-[var(--text-secondary)]">
        Drag & drop or click to choose an image.
      </p>

      <span className="mt-6 rounded-full bg-[var(--brand-primary)] px-5 py-2 text-sm font-semibold text-white">
        Choose Image
      </span>

      <input
        id="plant-image"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </label>
  );
}