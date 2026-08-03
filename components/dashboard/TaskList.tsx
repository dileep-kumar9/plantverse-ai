import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

const tasks = [
  {
    id: 1,
    title: "Water Tomato Plants",
    due: "Today",
    completed: false,
  },
  {
    id: 2,
    title: "Scan Rose Plant",
    due: "Tomorrow",
    completed: false,
  },
  {
    id: 3,
    title: "Add Organic Compost",
    due: "Friday",
    completed: true,
  },
];

export default function TaskList() {
  return (
    <Card className="h-full">
      <Badge>Today&apos;s Tasks</Badge>

      <div className="mt-6 space-y-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center justify-between rounded-2xl border border-[var(--border-color)] p-4"
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={task.completed}
                readOnly
                className="h-5 w-5"
              />

              <div>
                <p className="font-medium">
                  {task.title}
                </p>

                <p className="text-sm text-[var(--text-secondary)]">
                  {task.due}
                </p>
              </div>
            </div>

            {task.completed && (
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                Done
              </span>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}