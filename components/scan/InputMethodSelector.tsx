import type { InputMethod } from "@/types/scan-wizard";

type InputMethodOption = {
  id: InputMethod;
  title: string;
  description: string;
  icon: string;
};

type InputMethodSelectorProps = {
  selectedMethod: InputMethod | null;
  onSelect: (method: InputMethod) => void;
};

const inputMethods: InputMethodOption[] = [
  {
    id: "camera",
    title: "Camera",
    description: "Take a new photo using your device camera.",
    icon: "📷",
  },
  {
    id: "gallery",
    title: "Gallery",
    description: "Choose an existing photo from your device.",
    icon: "🖼️",
  },
  {
    id: "video",
    title: "Video",
    description: "Record the plant or location while explaining the problem.",
    icon: "🎥",
  },
  {
    id: "voice",
    title: "Voice",
    description: "Describe what you see and what help you need.",
    icon: "🎤",
  },
];

export default function InputMethodSelector({
  selectedMethod,
  onSelect,
}: InputMethodSelectorProps) {
  return (
    <section>
      <div className="mb-5">
        <p className="eyebrow">Step 2</p>

        <h2 className="mt-1 text-2xl font-semibold tracking-tight">
          How would you like to provide the evidence?
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          Start with one input. PlantVerse can request another angle, close-up,
          explanation, or short video when the first input is not enough.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {inputMethods.map((method) => {
          const selected = selectedMethod === method.id;

          return (
            <button
              key={method.id}
              type="button"
              onClick={() => onSelect(method.id)}
              aria-pressed={selected}
              className={[
                "flex min-h-44 w-full items-start gap-4 rounded-3xl border p-5 text-left transition-all duration-200",
                selected
                  ? "border-[var(--brand-primary)] bg-[var(--brand-soft)] ring-2 ring-[var(--brand-primary)]/20"
                  : "border-[var(--border-color)] bg-[var(--surface-primary)] hover:-translate-y-1 hover:border-[var(--brand-primary)] hover:shadow-[var(--shadow-md)]",
              ].join(" ")}
            >
              <span
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-secondary)] text-3xl"
                aria-hidden="true"
              >
                {method.icon}
              </span>

              <span className="min-w-0">
                <span className="block text-lg font-semibold">
                  {method.title}
                </span>

                <span className="mt-2 block text-sm leading-6 text-[var(--text-secondary)]">
                  {method.description}
                </span>

                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-primary)]">
                  {selected ? "Selected" : "Choose method"}
                  <span aria-hidden="true">→</span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}