import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

export default function GardenHealth() {
  return (
    <Card className="mt-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Badge tone="success">Garden Health</Badge>

          <h2 className="mt-4 text-3xl font-bold">
            89%
          </h2>

          <p className="mt-2 text-[var(--text-secondary)]">
            Your plants are healthy overall.
          </p>
        </div>

        <div className="flex-1">
          <div className="h-4 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-green-600"
              style={{ width: "89%" }}
            />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4 text-center">

            <div>
              <p className="text-2xl font-bold text-green-600">
                24
              </p>

              <p className="text-sm text-[var(--text-secondary)]">
                Plants
              </p>
            </div>

            <div>
              <p className="text-2xl font-bold text-orange-500">
                3
              </p>

              <p className="text-sm text-[var(--text-secondary)]">
                Attention
              </p>
            </div>

            <div>
              <p className="text-2xl font-bold text-blue-600">
                12
              </p>

              <p className="text-sm text-[var(--text-secondary)]">
                Scans
              </p>
            </div>

          </div>
        </div>
      </div>
    </Card>
  );
}