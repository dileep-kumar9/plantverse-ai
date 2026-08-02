import type { ReactNode } from "react";

type BadgeTone = "brand" | "success" | "warning" | "danger" | "neutral";

type BadgeProps = {
  children: ReactNode;
  tone?: BadgeTone;
};

const tones: Record<BadgeTone, string> = {
  brand: "bg-[var(--brand-soft)] text-[var(--brand-primary)]",
  success: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  danger: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  neutral:
    "bg-[var(--surface-secondary)] text-[var(--text-secondary)]",
};

export default function Badge({
  children,
  tone = "brand",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}