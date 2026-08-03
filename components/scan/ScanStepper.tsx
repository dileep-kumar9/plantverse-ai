type ScanStepperProps = { currentStep: number };

const steps = [
  { id: 1, label: "Choose analysis" },
  { id: 2, label: "Add evidence" },
  { id: 3, label: "AI inspection" },
  { id: 4, label: "Results" },
];

export default function ScanStepper({ currentStep }: ScanStepperProps) {
  return (
    <nav aria-label="Smart Scan progress">
      <ol className="grid list-none grid-cols-4 gap-2 p-0">
        {steps.map((step) => {
          const completed = step.id < currentStep;
          const active = step.id === currentStep;
          return (
            <li key={step.id} className="min-w-0 list-none">
              <div className={`h-1.5 rounded-full transition-all duration-300 ${completed || active ? "bg-[var(--brand-primary)]" : "bg-[var(--surface-secondary)]"}`} />
              <div className="mt-2 flex items-center gap-2">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${completed ? "bg-[var(--brand-primary)] text-white" : active ? "border-2 border-[var(--brand-primary)] bg-[var(--surface-primary)] text-[var(--brand-primary)]" : "bg-[var(--surface-secondary)] text-[var(--text-tertiary)]"}`}>
                  {completed ? "✓" : step.id}
                </span>
                <span className={`hidden truncate text-xs font-medium sm:block ${active || completed ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]"}`}>{step.label}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
