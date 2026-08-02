import type { ScanMode } from "@/types/scan";

type ScanModeCardProps = {
  mode: ScanMode;
  selected: boolean;
  onSelect: (mode: ScanMode) => void;
};

export default function ScanModeCard({
  mode,
  selected,
  onSelect,
}: ScanModeCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(mode)}
      className={`group flex h-full w-full flex-col rounded-3xl border p-6 text-left transition-all duration-300 ${
        selected
          ? "border-green-600 bg-green-50 shadow-lg"
          : "border-gray-200 bg-white hover:-translate-y-1 hover:border-green-500 hover:shadow-md"
      }`}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-4xl">
        {mode.icon}
      </div>

      <h2 className="mt-5 text-xl font-bold text-gray-900">
        {mode.title}
      </h2>

      <p className="mt-3 text-sm leading-6 text-gray-600">
        {mode.description}
      </p>

      <div className="mt-5 space-y-2">
        {mode.features.map((feature) => (
          <div
            key={feature}
            className="flex items-center gap-2 text-sm text-gray-600"
          >
            <span className="font-bold text-green-600">✓</span>
            <span>{feature}</span>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-6">
        <span
          className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${
            selected
              ? "bg-green-600 text-white"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {selected ? "Selected" : "Choose"}
        </span>
      </div>
    </button>
  );
}