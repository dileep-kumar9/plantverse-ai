import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

const activities = [
  {
    id: 1,
    icon: "📷",
    title: "Tomato scanned",
    subtitle: "Healthy",
    time: "10 minutes ago",
  },
  {
    id: 2,
    icon: "🌱",
    title: "Soil analyzed",
    subtitle: "Moisture 72%",
    time: "Yesterday",
  },
  {
    id: 3,
    icon: "🌿",
    title: "Aloe Vera checked",
    subtitle: "No disease detected",
    time: "2 days ago",
  },
];

export default function RecentActivity() {
  return (
    <Card>
      <div>
        <Badge>Recent activity</Badge>

        <h2 className="mt-4 text-xl font-semibold tracking-tight">
          Latest garden updates
        </h2>

        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Your most recent scans and plant checks.
        </p>
      </div>

      <ol className="mt-6 divide-y divide-[var(--border-color)]">
        {activities.map((item) => (
          <li key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
            <div
              className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--brand-soft)] text-2xl"
              aria-hidden="true"
            >
              {item.icon}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <p className="font-semibold">{item.title}</p>

                <time className="shrink-0 text-xs text-[var(--text-tertiary)]">
                  {item.time}
                </time>
              </div>

              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {item.subtitle}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}