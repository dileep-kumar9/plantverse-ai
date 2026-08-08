"use client";

import { ArrowUpRight, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  FormEvent,
  KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

const destinations = [
  {
    label: "Smart Scan",
    description: "Analyze plants, leaves, soil, fruits, flowers, and pests.",
    keywords: "scan plant disease soil image photo camera leaf pest analysis",
    href: "/scan",
  },
  {
    label: "My Plants",
    description: "View your saved plants and health records.",
    keywords: "plants garden health saved collection records",
    href: "/plants",
  },
  {
    label: "Plant Memory",
    description: "Open saved reports and previous scan history.",
    keywords: "memory reports history timeline scans saved report",
    href: "/memory",
  },
  {
    label: "Planner",
    description: "Plan crops and plants for your growing space.",
    keywords: "land crop garden terrace pot field space planning",
    href: "/planner",
  },
  {
    label: "AI Assistant",
    description: "Ask questions about plants and gardening.",
    keywords: "ask chat help voice question artificial intelligence",
    href: "/assistant",
  },
  {
    label: "Translator",
    description: "Translate plant names and reports.",
    keywords:
      "translate language telugu hindi tamil kannada malayalam report",
    href: "/translator",
  },
  {
    label: "Devices",
    description: "Manage meters, sensors, and manual readings.",
    keywords: "device meter bluetooth moisture sensor reading",
    href: "/devices",
  },
  {
    label: "Marketplace",
    description: "Find plant-care products and supplies.",
    keywords: "products fertilizer pesticide seeds tools supplies shopping",
    href: "/marketplace",
  },
  {
    label: "Cart",
    description: "Review products added to your cart.",
    keywords: "cart basket checkout products",
    href: "/cart",
  },
  {
    label: "Orders",
    description: "View order, delivery, and payment details.",
    keywords: "orders delivery tracking billing payment purchase",
    href: "/orders",
  },
  {
    label: "Reminders",
    description: "Manage watering and plant-care tasks.",
    keywords:
      "tasks calendar water watering fertilizer reminder notification",
    href: "/reminders",
  },
  {
    label: "Community",
    description: "Connect with growers and plant experts.",
    keywords: "community expert farmer grower questions discussion",
    href: "/community",
  },
  {
    label: "Settings",
    description: "Manage theme, language, and privacy.",
    keywords: "settings theme language privacy account preferences",
    href: "/settings",
  },
];

function normalizeText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export default function SearchBar() {
  const router = useRouter();
  const listboxId = useId();

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const matches = useMemo(() => {
    const normalizedQuery = normalizeText(query);

    if (!normalizedQuery) {
      return destinations.slice(0, 6);
    }

    const searchTerms = normalizedQuery.split(" ");

    return destinations
      .filter((item) => {
        const searchableText = normalizeText(
          `${item.label} ${item.description} ${item.keywords}`,
        );

        return searchTerms.every((term) =>
          searchableText.includes(term),
        );
      })
      .slice(0, 7);
  }, [query]);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    }

    function handleOutsideClick(event: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleShortcut);
    window.addEventListener("pointerdown", handleOutsideClick);

    return () => {
      window.removeEventListener("keydown", handleShortcut);
      window.removeEventListener("pointerdown", handleOutsideClick);
    };
  }, []);

  function openResult(href: string) {
    setQuery("");
    setIsOpen(false);
    setActiveIndex(0);
    router.push(href);
  }

  function clearSearch() {
    setQuery("");
    setActiveIndex(0);
    setIsOpen(true);
    inputRef.current?.focus();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const selectedResult = matches[activeIndex] ?? matches[0];

    if (selectedResult) {
      openResult(selectedResult.href);
    }
  }

  function handleKeyDown(
    event: ReactKeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "ArrowDown") {
      event.preventDefault();

      if (!isOpen) {
        setIsOpen(true);
        return;
      }

      if (matches.length > 0) {
        setActiveIndex(
          (current) => (current + 1) % matches.length,
        );
      }

      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      if (!isOpen) {
        setIsOpen(true);
        return;
      }

      if (matches.length > 0) {
        setActiveIndex(
          (current) =>
            (current - 1 + matches.length) % matches.length,
        );
      }

      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      inputRef.current?.blur();
    }
  }

  const activeResult = matches[activeIndex];

  return (
    <div ref={containerRef} className="relative z-30 mb-8">
      <form
        role="search"
        onSubmit={submit}
        className="flex items-center gap-3 rounded-2xl border border-(--border-color) bg-(--surface-primary) px-4 py-3.5 shadow-sm transition-colors focus-within:border-(--brand-primary) focus-within:ring-2 focus-within:ring-(--brand-soft) sm:px-5 sm:py-4"
      >
        <Search
          size={20}
          className="shrink-0 text-(--text-secondary)"
          aria-hidden="true"
        />

        <input
          ref={inputRef}
          type="text"
          role="combobox"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search PlantVerse or open a feature…"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-(--text-tertiary)"
          aria-label="Search PlantVerse"
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-expanded={isOpen}
          aria-activedescendant={
            isOpen && activeResult
              ? `${listboxId}-option-${activeIndex}`
              : undefined
          }
        />

        {query ? (
          <button
            type="button"
            onClick={clearSearch}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-(--text-secondary) transition hover:bg-(--surface-secondary) hover:text-(--text-primary)"
            aria-label="Clear search"
          >
            <X size={18} />
          </button>
        ) : (
          <span className="hidden shrink-0 rounded-lg bg-(--surface-secondary) px-3 py-1 text-xs text-(--text-secondary) sm:inline">
            Ctrl / ⌘ K
          </span>
        )}
      </form>

      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="PlantVerse search results"
          className="animate-scale-in absolute left-0 right-0 top-[calc(100%+0.6rem)] max-h-96 origin-top overflow-y-auto rounded-2xl border border-(--border-color) bg-(--surface-primary) p-2 shadow-(--shadow-lg)"
        >
          {matches.length > 0 ? (
            matches.map((item, index) => {
              const isActive = index === activeIndex;

              return (
                <button
                  id={`${listboxId}-option-${index}`}
                  key={item.href}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => openResult(item.href)}
                  className={`flex w-full items-center justify-between gap-4 rounded-xl px-3 py-3 text-left transition ${
                    isActive
                      ? "bg-(--surface-secondary)"
                      : "hover:bg-(--surface-secondary)"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block font-medium">
                      {item.label}
                    </span>

                    <span className="mt-1 block truncate text-xs text-(--text-secondary) sm:text-sm">
                      {item.description}
                    </span>
                  </span>

                  <ArrowUpRight
                    size={17}
                    className="shrink-0 text-(--text-tertiary)"
                    aria-hidden="true"
                  />
                </button>
              );
            })
          ) : (
            <div className="px-3 py-5 text-center">
              <p className="text-sm font-medium">
                No matching feature found
              </p>

              <p className="mt-1 text-xs text-(--text-secondary)">
                Try searching for scan, plants, reports, reminders,
                or marketplace.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}