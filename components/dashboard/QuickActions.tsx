import Link from "next/link";

import Card from "@/components/ui/Card";

const actions = [
  {
    title: "Smart Scan",
    icon: "📷",
    href: "/scan",
    color:
      "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300",
    description: "Scan a plant, leaf, soil, fruit, flower, tree or pest.",
  },
  {
    title: "My Plants",
    icon: "🌿",
    href: "/plants",
    color:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    description: "View plants, health records, notes and follow-ups.",
  },
  {
    title: "Plan a Space",
    icon: "🌾",
    href: "/planner",
    color:
      "bg-lime-100 text-lime-700 dark:bg-lime-500/15 dark:text-lime-300",
    description: "Plan a pot, terrace, garden, field or open land.",
  },
  {
    title: "Translate",
    icon: "🌐",
    href: "/translator",
    color:
      "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
    description: "Translate plant names, selected text or reports.",
  },
  {
    title: "Find Supplies",
    icon: "🛒",
    href: "/marketplace",
    color:
      "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
    description: "Explore products for plant care, soil and treatment.",
  },
  {
    title: "Check a Meter",
    icon: "📡",
    href: "/devices",
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
    description: "Record soil-meter readings and device details.",
  },
];

export default function QuickActions() {
  return (
    <section
      className="mt-7 sm:mt-9"
      aria-labelledby="quick-actions-title"
    >
      <div className="mb-3 sm:mb-4">
        <p className="eyebrow">Start here</p>

        <h2
          id="quick-actions-title"
          className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl"
        >
          Quick actions
        </h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {actions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className="group block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2 sm:h-full"
          >
            <Card
              interactive
              className="flex items-start gap-3.5 p-4 sm:h-full sm:flex-col sm:gap-0 sm:p-5"
            >
              <div
                className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-xl sm:h-14 sm:w-14 sm:text-2xl ${action.color}`}
                aria-hidden="true"
              >
                {action.icon}
              </div>

              <div className="min-w-0 flex-1 sm:flex sm:w-full sm:flex-col">
                <h3 className="text-base font-semibold tracking-tight sm:mt-4 sm:text-lg">
                  {action.title}
                </h3>

                <p className="mt-1.5 text-sm leading-5 text-[var(--text-secondary)] sm:flex-1 sm:leading-6">
                  {action.description}
                </p>

                <span className="mt-2.5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-primary)] sm:mt-4">
                  Open
                  <span
                    className="transition-transform duration-200 group-hover:translate-x-1"
                    aria-hidden="true"
                  >
                    →
                  </span>
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
