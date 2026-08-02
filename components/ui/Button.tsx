import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "border border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-secondary)]",
  secondary:
    "border border-[var(--brand-soft)] bg-[var(--brand-soft)] text-[var(--brand-primary)] hover:bg-[var(--surface-hover)]",
  outline:
    "border border-[var(--border-color)] bg-[var(--surface-primary)] text-[var(--text-primary)] hover:border-[var(--brand-primary)] hover:bg-[var(--surface-hover)]",
  ghost:
    "border border-transparent bg-transparent text-[var(--text-primary)] hover:bg-[var(--surface-hover)]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 py-2 text-sm",
  md: "min-h-11 px-4 py-2.5 text-sm",
  lg: "min-h-12 px-5 py-3 text-base",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-[var(--duration-fast)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}