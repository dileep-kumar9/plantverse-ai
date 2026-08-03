export default function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">{eyebrow}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1><p className="mt-3 max-w-2xl leading-7 text-[var(--text-secondary)]">{description}</p></div>{action}</div>;
}
