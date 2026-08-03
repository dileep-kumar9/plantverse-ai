import Link from "next/link";
import Card from "@/components/ui/Card";

const actions = [
  { title: "Smart Scan", icon: "📷", href: "/scan", color: "bg-green-100", description: "Choose plant, soil, land, fruit, flower, tree, or pest analysis." },
  { title: "My Plants", icon: "🌿", href: "/plants", color: "bg-emerald-100", description: "Open saved plants, health history, notes, and follow-up scans." },
  { title: "Plan a Space", icon: "🌾", href: "/planner", color: "bg-lime-100", description: "Plan a pot, terrace, field, or empty growing area." },
  { title: "Translate", icon: "🌐", href: "/translator", color: "bg-blue-100", description: "Translate plant names, selected text, and complete reports." },
  { title: "Find Supplies", icon: "🛒", href: "/marketplace", color: "bg-orange-100", description: "Review products related to treatments, soil, and devices." },
  { title: "Check a Meter", icon: "📡", href: "/devices", color: "bg-purple-100", description: "Verify a soil meter by model or link and enter readings manually." },
];

export default function QuickActions() {
  return (
    <section className="mt-10">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div><p className="eyebrow">Start here</p><h2 className="mt-1 text-2xl font-semibold">Quick actions</h2></div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((action) => (
          <Link key={action.title} href={action.href} className="group">
            <Card interactive className="h-full">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ${action.color}`}>{action.icon}</div>
              <h3 className="mt-5 text-lg font-semibold">{action.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{action.description}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-primary)]">Open <span className="transition group-hover:translate-x-1">→</span></span>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
