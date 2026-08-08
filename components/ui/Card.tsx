import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  interactive?: boolean;
};

export default function Card({
  children,
  interactive = false,
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={[
        "rounded-[var(--radius-lg)] border border-[var(--border-color)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-sm)]",
        interactive
          ? "transition-all duration-[var(--duration-normal)] hover:-translate-y-1 hover:border-[var(--brand-primary)] hover:shadow-[var(--shadow-md)] active:translate-y-0 active:scale-[0.98] active:shadow-[var(--shadow-sm)]"
          : "",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}