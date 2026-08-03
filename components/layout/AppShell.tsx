"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  ["/", "🏠", "Home"], ["/scan", "📷", "Smart Scan"],
  ["/plants", "🌿", "My Plants"], ["/memory", "🧠", "Plant Memory"],
  ["/planner", "🌾", "Planner"], ["/assistant", "🤖", "AI Assistant"],
  ["/translator", "🌐", "Translator"], ["/devices", "📡", "Devices"],
  ["/marketplace", "🛒", "Marketplace"], ["/orders", "📦", "Orders"],
  ["/community", "👨‍🌾", "Community"],
  ["/settings", "⚙️", "Settings"],
] as const;

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [dark, setDark] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    const enabled = localStorage.getItem("plantverse-theme") === "dark";
    setDark(enabled);
    document.documentElement.classList.toggle("dark", enabled);
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("plantverse-theme", next ? "dark" : "light");
  }

  return (
    <div className="min-h-screen bg-[var(--app-background)] text-[var(--text-primary)]">
      <header className="sticky top-0 z-50 border-b border-[var(--border-color)] bg-[var(--header-background)]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3 font-semibold">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--brand-primary)] text-xl text-white">🌿</span>
            <span>PlantVerse AI</span>
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="icon-button" aria-label="Toggle theme">{dark ? "☀️" : "🌙"}</button>
            <button onClick={() => setMenu(!menu)} className="icon-button lg:hidden" aria-label="Open menu">☰</button>
            <Link href="/settings" className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-soft)] font-semibold text-[var(--brand-primary)]">D</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] lg:grid lg:grid-cols-[230px_1fr] lg:gap-5 lg:px-5">
        <aside className={`${menu ? "block" : "hidden"} border-b border-[var(--border-color)] bg-[var(--surface-primary)] p-3 lg:sticky lg:top-20 lg:block lg:h-[calc(100vh-6rem)] lg:rounded-3xl lg:border lg:mt-4`}>
          <nav className="grid grid-cols-2 gap-1 sm:grid-cols-4 lg:grid-cols-1">
            {links.map(([href, icon, label]) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return <Link key={href} href={href} onClick={() => setMenu(false)} className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition ${active ? "bg-[var(--brand-soft)] text-[var(--brand-primary)]" : "text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]"}`}><span>{icon}</span><span>{label}</span></Link>;
            })}
          </nav>
          <div className="mt-5 rounded-2xl bg-[var(--brand-soft)] p-4 text-sm">
            <p className="font-semibold text-[var(--brand-primary)]">Device readings</p>
            <p className="mt-1 text-[var(--text-secondary)]">All meters work through manual entry; supported browser devices can connect directly.</p>
          </div>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
