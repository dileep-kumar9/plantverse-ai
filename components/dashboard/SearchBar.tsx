"use client";

import { useEffect, useRef, useState } from "react";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }

    window.addEventListener("keydown", handleShortcut);

    return () => {
      window.removeEventListener("keydown", handleShortcut);
    };
  }, []);

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--surface-primary)] px-5 py-4 shadow-sm">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          className="h-5 w-5 shrink-0 text-[var(--text-secondary)]"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
        </svg>

        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search plants, diseases, reports, marketplace..."
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-tertiary)]"
          aria-label="Search PlantVerse"
        />

        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="text-sm font-medium text-[var(--brand-primary)]"
          >
            Clear
          </button>
        ) : (
          <span className="hidden rounded-lg bg-[var(--surface-secondary)] px-3 py-1 text-xs text-[var(--text-secondary)] sm:inline">
            Ctrl K
          </span>
        )}
      </div>
    </div>
  );
}