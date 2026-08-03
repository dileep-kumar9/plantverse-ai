import type { ScanCategory, ScanType } from "@/types/scan-wizard";
import { scanTypes } from "@/types/scan-wizard";

type ScanTypeSelectorProps = {
  selectedType: ScanCategory | null;
  onSelect: (scanType: ScanType) => void;
};

export default function ScanTypeSelector({
  selectedType,
  onSelect,
}: ScanTypeSelectorProps) {
  return (
    <section>
      <div className="mb-5">
        <p className="eyebrow">Step 1</p>

        <h2 className="mt-1 text-2xl font-semibold tracking-tight">
          What would you like to analyze?
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          Choose the closest option. PlantVerse can ask for another photo,
          video, or explanation when more evidence is needed.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {scanTypes.map((scanType) => {
          const selected = selectedType === scanType.id;

          return (
            <button
              key={scanType.id}
              type="button"
              onClick={() => onSelect(scanType)}
              aria-pressed={selected}
              className={[
                "group flex min-h-56 w-full flex-col rounded-3xl border p-5 text-left transition-all duration-200",
                selected
                  ? "border-[var(--brand-primary)] bg-[var(--brand-soft)] ring-2 ring-[var(--brand-primary)]/20"
                  : "border-[var(--border-color)] bg-[var(--surface-primary)] hover:-translate-y-1 hover:border-[var(--brand-primary)] hover:shadow-[var(--shadow-md)]",
              ].join(" ")}
            >
              <span
                className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl"
                style={{
                  backgroundColor: `${scanType.accent}18`,
                  color: scanType.accent,
                }}
                aria-hidden="true"
              >
                {scanType.icon}
              </span>

              <h3 className="mt-5 text-xl font-semibold tracking-tight">
                {scanType.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                {scanType.description}
              </p>

              <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-[var(--brand-primary)]">
                {selected ? "Selected" : "Choose"}
                <span aria-hidden="true">→</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}