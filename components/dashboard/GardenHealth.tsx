import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

const stats = [
  {
    value: "24",
    label: "Plants",
    tone: "text-green-600 dark:text-green-400",
  },
  {
    value: "3",
    label: "Need attention",
    tone: "text-amber-600 dark:text-amber-400",
  },
  {
    value: "12",
    label: "Scans this week",
    tone: "text-blue-600 dark:text-blue-400",
  },
];

export default function GardenHealth() {
  const healthScore = 89;

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Badge tone="success">Garden health</Badge>

          <div className="mt-4 flex items-end gap-2">
            <h2 className="text-4xl font-semibold tracking-tight">
              {healthScore}%
            </h2>

            <span className="pb-1 text-sm font-medium text-green-600 dark:text-green-400">
              Healthy
            </span>
          </div>

          <p className="mt-2 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
            Your garden is healthy overall. Three plants may need a closer
            inspection.
          </p>
        </div>

        <span
          className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[var(--brand-soft)] text-2xl"
          aria-hidden="true"
        >
          🌿
        </span>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between gap-4 text-xs font-medium text-[var(--text-secondary)]">
          <span>Overall condition</span>
          <span>{healthScore}/100</span>
        </div>

        <div
          className="mt-2 h-3 overflow-hidden rounded-full bg-[var(--surface-secondary)]"
          role="progressbar"
          aria-label="Overall garden health"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={healthScore}
        >
          <div
            className="h-full rounded-full bg-[var(--brand-primary)] transition-[width] duration-500"
            style={{ width: `${healthScore}%` }}
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="min-w-0 rounded-2xl border border-[var(--border-color)] bg-[var(--surface-secondary)] px-3 py-4 text-center sm:px-4"
          >
            <p className={`text-2xl font-semibold ${stat.tone}`}>
              {stat.value}
            </p>

            <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}