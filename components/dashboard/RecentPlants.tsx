import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

const plants = [
  {
    id: 1,
    icon: "🍅",
    name: "Tomato",
    scientificName: "Solanum lycopersicum",
    status: "Healthy",
    lastChecked: "10 minutes ago",
  },
  {
    id: 2,
    icon: "🌿",
    name: "Aloe Vera",
    scientificName: "Aloe barbadensis",
    status: "Healthy",
    lastChecked: "2 days ago",
  },
  {
    id: 3,
    icon: "🪴",
    name: "Money Plant",
    scientificName: "Epipremnum aureum",
    status: "Needs attention",
    lastChecked: "4 days ago",
  },
];

export default function RecentPlants() {
  return (
    <section className="mt-10" aria-labelledby="recent-plants-title">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <Badge>Recent plants</Badge>

          <h2
            id="recent-plants-title"
            className="mt-3 text-2xl font-semibold tracking-tight"
          >
            Recently checked plants
          </h2>

          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Continue monitoring your recently saved plants.
          </p>
        </div>

        <Link
          href="/plants"
          className="shrink-0 text-sm font-semibold text-[var(--brand-primary)] hover:underline"
        >
          View all
        </Link>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {plants.map((plant) => {
          const needsAttention = plant.status === "Needs attention";

          return (
            <Card key={plant.id} interactive className="h-full">
              <div className="flex items-start gap-4">
                <div
                  className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[var(--brand-soft)] text-2xl"
                  aria-hidden="true"
                >
                  {plant.icon}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">{plant.name}</h3>

                  <p className="mt-1 truncate text-xs italic text-[var(--text-tertiary)]">
                    {plant.scientificName}
                  </p>

                  <span
                    className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      needsAttention
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                        : "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300"
                    }`}
                  >
                    {plant.status}
                  </span>
                </div>
              </div>

              <p className="mt-5 text-xs text-[var(--text-tertiary)]">
                Last checked: {plant.lastChecked}
              </p>
            </Card>
          );
        })}
      </div>
    </section>
  );
}