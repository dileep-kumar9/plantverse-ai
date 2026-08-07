"use client";

import { LogOut, Menu, Moon, Sun, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import GlobalVoiceAssistant from "@/components/global/GlobalVoiceAssistant";
import SelectionTranslator from "@/components/global/SelectionTranslator";

const links = [
  ["/dashboard", "🏠", "Home"],
  ["/scan", "📷", "Smart Scan"],
  ["/plants", "🌿", "My Plants"],
  ["/memory", "🧠", "Plant Memory"],
  ["/planner", "🌾", "Planner"],
  ["/assistant", "🤖", "AI Assistant"],
  ["/translator", "🌐", "Translator"],
  ["/devices", "📡", "Devices"],
  ["/marketplace", "🛒", "Marketplace"],
  ["/cart", "🧺", "Cart"],
  ["/orders", "📦", "Orders"],
  ["/reminders", "⏰", "Reminders"],
  ["/community", "👨‍🌾", "Community"],
  ["/settings", "⚙️", "Settings"],
] as const;

const minimalRoutes = [
  "/",
  "/offline",
  "/login",
  "/signup",
  "/forgot-password",
  "/verify-email",
  "/auth",
  "/privacy",
  "/terms",
  "/cookies",
  "/shipping",
  "/refunds",
  "/safety",
];

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, sessionError, logout } = useAuth();
  const [dark, setDark] = useState(false);
  const [menu, setMenu] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const minimal = minimalRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  useEffect(() => {
    const enabled = localStorage.getItem("plantverse-theme") === "dark";
    setDark(enabled);
    document.documentElement.classList.toggle("dark", enabled);
  }, []);

  useEffect(() => setMenu(false), [pathname]);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("plantverse-theme", next ? "dark" : "light");
  }

  async function handleLogout() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await logout();
      router.replace("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  if (minimal) {
    return (
      <div className="min-h-screen bg-[var(--app-background)] text-[var(--text-primary)]">
        <header className="border-b border-[var(--border-color)] bg-[var(--header-background)]">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-3 font-semibold">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--brand-primary)] text-xl text-white">🌿</span>
              PlantVerse AI
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/privacy" className="hidden text-sm text-[var(--text-secondary)] sm:inline">Privacy</Link>
              <Link href="/terms" className="hidden text-sm text-[var(--text-secondary)] sm:inline">Terms</Link>
              <button type="button" onClick={toggleTheme} className="icon-button" aria-label="Toggle color theme">
                {dark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>
        </header>
        {children}
      </div>
    );
  }

  const initial = user?.name?.trim().charAt(0).toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-[var(--app-background)] text-[var(--text-primary)]">
      <header className="sticky top-0 z-50 border-b border-[var(--border-color)] bg-[var(--header-background)]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-3 font-semibold">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--brand-primary)] text-xl text-white">🌿</span>
            <span>PlantVerse AI</span>
          </Link>
          <div className="flex items-center gap-2">
            {user ? <Link href="/notifications" className="icon-button" aria-label="Notifications">🔔</Link> : null}
            <button type="button" onClick={toggleTheme} className="icon-button" aria-label="Toggle color theme">
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button type="button" onClick={() => setMenu((value) => !value)} className="icon-button lg:hidden" aria-label="Toggle navigation" aria-expanded={menu}>
              {menu ? <X size={19} /> : <Menu size={19} />}
            </button>
            {loading ? (
              <span className="h-10 w-10 animate-pulse rounded-full bg-[var(--surface-secondary)]" aria-label="Checking account" />
            ) : user ? (
              <>
                <Link href="/profile" title={user.name} className="grid h-10 w-10 place-items-center rounded-full bg-[var(--brand-soft)] font-semibold text-[var(--brand-primary)]" aria-label="Profile">
                  {initial}
                </Link>
                <button type="button" disabled={signingOut} onClick={() => void handleLogout()} className="icon-button" aria-label="Sign out">
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <Link href="/login" className="rounded-xl bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white">Sign in</Link>
            )}
          </div>
        </div>
        {sessionError ? <div className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">{sessionError}</div> : null}
      </header>

      <div className="mx-auto max-w-[1500px] lg:grid lg:grid-cols-[230px_1fr] lg:gap-5 lg:px-5">
        <aside className={`${menu ? "block" : "hidden"} border-b border-[var(--border-color)] bg-[var(--surface-primary)] p-3 lg:sticky lg:top-20 lg:mt-4 lg:block lg:h-[calc(100vh-6rem)] lg:overflow-y-auto lg:rounded-3xl lg:border`}>
          {user ? (
            <div className="mb-3 rounded-2xl bg-[var(--surface-secondary)] p-3 lg:hidden">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="truncate text-xs text-[var(--text-secondary)]">{user.email}</p>
            </div>
          ) : null}
          <nav className="grid grid-cols-2 gap-1 sm:grid-cols-4 lg:grid-cols-1" aria-label="Primary navigation">
            {links.map(([href, icon, label]) => {
              const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
              return (
                <Link key={href} href={href} className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium ${active ? "bg-[var(--brand-soft)] text-[var(--brand-primary)]" : "text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]"}`}>
                  <span aria-hidden="true">{icon}</span>{label}
                </Link>
              );
            })}
            {user?.role === "admin" ? (
              <Link href="/admin" className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]"><span>🛡️</span>Admin</Link>
            ) : null}
          </nav>
          {user ? (
            <div className="mt-4 hidden border-t border-[var(--border-color)] pt-4 lg:block">
              <p className="truncate px-3 text-sm font-semibold">{user.name}</p>
              <p className="truncate px-3 text-xs text-[var(--text-secondary)]">{user.email}</p>
            </div>
          ) : null}
        </aside>
        <div className="min-w-0">
          {children}
          <footer className="mx-auto mt-12 flex max-w-7xl flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-[var(--border-color)] px-4 py-6 text-xs text-[var(--text-secondary)] sm:px-6">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/cookies">Cookies</Link>
            <Link href="/shipping">Shipping</Link>
            <Link href="/refunds">Refunds</Link>
            <Link href="/safety">AI safety</Link>
          </footer>
        </div>
      </div>
      {user ? <><GlobalVoiceAssistant /><SelectionTranslator /></> : null}
    </div>
  );
}
