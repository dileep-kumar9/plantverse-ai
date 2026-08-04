import Link from "next/link";
import Card from "@/components/ui/Card";

const actions = [
  {
    title: "Smart Scan",
    icon: "📷",
    href: "/scan",
    color:
      "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300",
    description: "Scan a plant, leaf, soil, fruit, flower, tree, or pest.",
  },
  {
    title: "My Plants",
    icon: "🌿",
    href: "/plants",
    color:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    description: "View saved plants, health records, notes, and follow-ups.",
  },
  {
    title: "Plan a Space",
    icon: "🌾",
    href: "/planner",
    color:
      "bg-lime-100 text-lime-700 dark:bg-lime-500/15 dark:text-lime-300",
    description: "Plan plants for a pot, terrace, garden, or field.",
  },
  {
    title: "Translate",
    icon: "🌐",
    href: "/translator",
    color:
      "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
    description: "Translate plant names, selected text, or full reports.",
  },
  {
    title: "Find Supplies",
    icon: "🛒",
    href: "/marketplace",
    color:
      "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
    description: "Explore products for plant care, soil, and treatment.",
  },
  {
    title: "Check a Meter",
    icon: "📡",
    href: "/devices",
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
    description: "Check soil meter details and record readings manually.",
  },
];

export default function QuickActions() {
  return (
    <section className="mt-10" aria-labelledby="quick-actions-title">
      <div className="mb-5">
        <p className="eyebrow">Start here</p>

        <h2
          id="quick-actions-title"
          className="mt-1 text-2xl font-semibold tracking-tight"
        >
          Quick actions
        </h2>
      </div>

      <div className="grid auto-rows-fr gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className="group block h-full rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2"
          >
            <Card interactive className="flex h-full flex-col">
              <div
                className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-2xl ${action.color}`}
                aria-hidden="true"
              >
                {action.icon}
              </div>

              <h3 className="mt-5 text-lg font-semibold tracking-tight">
                {action.title}
              </h3>

              <p className="mt-2 flex-1 text-sm leading-6 text-[var(--text-secondary)]">
                {action.description}
              </p>

              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-primary)]">
                Open
                <span
                  className="transition-transform duration-200 group-hover:translate-x-1"
                  aria-hidden="true"
                >
                  →
                </span>
              </span>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}