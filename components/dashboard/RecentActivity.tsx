import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

const activity = [
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
    <Card className="h-full">
      <Badge>Recent Activity</Badge>

      <div className="mt-6 space-y-5">
        {activity.map((item) => (
          <div key={item.id} className="flex gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-2xl">
              {item.icon}
            </div>

            <div className="flex-1">
              <p className="font-semibold">{item.title}</p>

              <p className="text-sm text-[var(--text-secondary)]">
                {item.subtitle}
              </p>

              <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                {item.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}