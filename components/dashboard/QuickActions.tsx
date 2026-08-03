import Link from "next/link";

import Card from "@/components/ui/Card";

const actions = [
  {
    title: "Scan Plant",
    icon: "📷",
    href: "/scan",
    color: "bg-green-100",
  },
  {
    title: "Analyze Soil",
    icon: "🌱",
    href: "/scan",
    color: "bg-yellow-100",
  },
  {
    title: "Plan Land",
    icon: "🌾",
    href: "/scan",
    color: "bg-emerald-100",
  },
  {
    title: "Translator",
    icon: "🌐",
    href: "/translator",
    color: "bg-blue-100",
  },
  {
    title: "Marketplace",
    icon: "🛒",
    href: "/marketplace",
    color: "bg-orange-100",
  },
  {
    title: "Devices",
    icon: "📡",
    href: "/devices",
    color: "bg-purple-100",
  },
];

export default function QuickActions() {
  return (
    <section className="mt-10">
      <h2 className="mb-5 text-2xl font-bold">
        Quick Actions
      </h2>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((action) => (
          <Link key={action.title} href={action.href}>
            <Card interactive className="h-full">
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-2xl text-3xl ${action.color}`}
              >
                {action.icon}
              </div>

              <h3 className="mt-5 text-lg font-semibold">
                {action.title}
              </h3>

              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Open {action.title.toLowerCase()} workspace.
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}