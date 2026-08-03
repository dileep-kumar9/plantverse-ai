"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

const destinations = [
  { label: "Smart Scan", keywords: "scan plant disease soil image camera", href: "/scan" },
  { label: "My Plants", keywords: "plants garden health saved", href: "/plants" },
  { label: "Plant Memory", keywords: "memory reports history timeline scans", href: "/memory" },
  { label: "Planner", keywords: "land crop garden terrace reminders", href: "/planner" },
  { label: "AI Assistant", keywords: "ask chat help voice question", href: "/assistant" },
  { label: "Translator", keywords: "translate language telugu hindi tamil kannada", href: "/translator" },
  { label: "Devices", keywords: "device meter bluetooth moisture sensor", href: "/devices" },
  { label: "Marketplace", keywords: "products fertilizer pesticide seeds tools", href: "/marketplace" },
  { label: "Cart", keywords: "cart basket checkout", href: "/cart" },
  { label: "Orders", keywords: "orders delivery tracking billing", href: "/orders" },
  { label: "Reminders", keywords: "tasks calendar water fertilizer reminder", href: "/reminders" },
  { label: "Community", keywords: "community expert farmer questions", href: "/community" },
  { label: "Settings", keywords: "settings theme language privacy", href: "/settings" },
];

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const matches = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return destinations.slice(0, 6);
    return destinations.filter((item) => `${item.label} ${item.keywords}`.toLowerCase().includes(normalized)).slice(0, 7);
  }, [query]);

  function openResult(href: string) {
    setFocused(false);
    setQuery("");
    router.push(href);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (matches[0]) openResult(matches[0].href);
  }

  return (
    <div className="relative z-30 mb-8">
      <form onSubmit={submit} className="flex items-center gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--surface-primary)] px-5 py-4 shadow-sm focus-within:border-[var(--brand-primary)]">
        <Search size={20} className="shrink-0 text-[var(--text-secondary)]" aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 150)}
          placeholder="Search PlantVerse or open a feature…"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-tertiary)]"
          aria-label="Search PlantVerse"
        />
        {query ? (
          <button type="button" onClick={() => setQuery("")} className="text-[var(--text-secondary)]" aria-label="Clear search"><X size={18} /></button>
        ) : (
          <span className="hidden rounded-lg bg-[var(--surface-secondary)] px-3 py-1 text-xs text-[var(--text-secondary)] sm:inline">Ctrl K</span>
        )}
      </form>

      {focused ? (
        <div className="absolute left-0 right-0 top-[calc(100%+.6rem)] overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--surface-primary)] p-2 shadow-[var(--shadow-lg)]">
          {matches.length ? matches.map((item) => (
            <button key={item.href} type="button" onMouseDown={() => openResult(item.href)} className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left hover:bg-[var(--surface-secondary)]">
              <span className="font-medium">{item.label}</span><span className="text-xs text-[var(--text-tertiary)]">Open</span>
            </button>
          )) : <p className="px-3 py-4 text-sm text-[var(--text-secondary)]">No matching PlantVerse feature.</p>}
        </div>
      ) : null}
    </div>
  );
}
