import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

const stats = [
  { value: "24", label: "Plants", tone: "text-green-600" },
  { value: "3", label: "Need attention", tone: "text-amber-600" },
  { value: "12", label: "Scans this week", tone: "text-blue-600" },
];

export default function GardenHealth() {
  return (
    <Card className="h-full">
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge tone="success">Garden health</Badge>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight">89%</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Healthy overall, with three plants needing a closer look.</p>
          </div>
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--brand-soft)] text-2xl">🌿</span>
        </div>

        <div className="mt-6 h-3 overflow-hidden rounded-full bg-[var(--surface-secondary)]">
          <div className="h-full rounded-full bg-[var(--brand-primary)]" style={{ width: "89%" }} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface-secondary)] p-4 text-center">
              <p className={`text-2xl font-semibold ${stat.tone}`}>{stat.value}</p>
              <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
