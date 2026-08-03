type ScanStepperProps = {
  currentStep: number;
};

const steps = [
  { id: 1, label: "Scan type" },
  { id: 2, label: "Input method" },
  { id: 3, label: "Preview" },
  { id: 4, label: "Analysis" },
  { id: 5, label: "Results" },
];

export default function ScanStepper({
  currentStep,
}: ScanStepperProps) {
  return (
    <nav aria-label="Smart Scan progress">
      <ol className="grid grid-cols-5 gap-2">
        {steps.map((step) => {
          const completed = step.id < currentStep;
          const active = step.id === currentStep;

          return (
            <li key={step.id} className="min-w-0">
              <div
                className={[
                  "h-1.5 rounded-full transition-colors",
                  completed || active
                    ? "bg-[var(--brand-primary)]"
                    : "bg-[var(--surface-secondary)]",
                ].join(" ")}
              />

              <div className="mt-2 flex items-center gap-2">
                <span
                  className={[
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    completed
                      ? "bg-[var(--brand-primary)] text-white"
                      : active
                        ? "border-2 border-[var(--brand-primary)] bg-[var(--surface-primary)] text-[var(--brand-primary)]"
                        : "bg-[var(--surface-secondary)] text-[var(--text-tertiary)]",
                  ].join(" ")}
                >
                  {completed ? "✓" : step.id}
                </span>

                <span
                  className={[
                    "hidden truncate text-xs font-medium sm:block",
                    active || completed
                      ? "text-[var(--text-primary)]"
                      : "text-[var(--text-tertiary)]",
                  ].join(" ")}
                >
                  {step.label}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}