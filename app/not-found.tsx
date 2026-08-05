import Link from "next/link";

export default function NotFound() {
  return <main className="page-wrap"><div className="dashboard-panel text-center"><p className="eyebrow">404</p><h1 className="mt-3 text-3xl font-semibold">Page not found</h1><p className="mt-3 text-[var(--text-secondary)]">The page may have moved or the address may be incorrect.</p><Link href="/" className="voice-button mt-6">Return home</Link></div></main>;
}
