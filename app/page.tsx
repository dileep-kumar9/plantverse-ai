"use client";

import { useEffect, useState } from "react";

type IconProps = {
  className?: string;
};

function LeafIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M20.5 3.5C13 3.8 7.7 6.2 5.2 10.6c-2.1 3.7-.8 7.6 2.2 9.1 3.1 1.5 7 .1 8.7-3.1 2.2-4.1 1.4-8.2 4.4-13.1Z" />
      <path d="M5.7 19.2c2.9-5.1 6.4-8.3 11.2-10.9" />
    </svg>
  );
}

function SunIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M21 12.8A8.8 8.8 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />
    </svg>
  );
}

function CameraIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M14.5 4 16 6h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l1.5-2h5Z" />
      <circle cx="12" cy="12.5" r="3.5" />
    </svg>
  );
}

function SoilIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 15c3-2 5-2 8 0s5 2 10 0" />
      <path d="M3 19c3-2 5-2 8 0s5 2 10 0" />
      <path d="M12 14V7" />
      <path d="M12 9c-2.8 0-4.5-1.8-4.5-4.5C10.3 4.5 12 6.2 12 9Z" />
      <path d="M12 10c2.8 0 4.5-1.8 4.5-4.5C13.7 5.5 12 7.2 12 10Z" />
    </svg>
  );
}

function LandIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m3 18 5.5-8 4 5 2.5-3 6 6H3Z" />
      <path d="M3 21h18" />
      <circle cx="17" cy="6" r="2" />
    </svg>
  );
}

function VideoIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="6" width="13" height="12" rx="2" />
      <path d="m16 10 5-3v10l-5-3" />
    </svg>
  );
}

function MicrophoneIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0M12 17v5M8 22h8" />
    </svg>
  );
}

function HomeIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10M9 20v-6h6v6" />
    </svg>
  );
}

function CalendarIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

function UserIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function ArrowIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

const quickActions = [
  {
    title: "Scan Plant",
    description: "Identify health problems",
    icon: CameraIcon,
    tone: "green",
  },
  {
    title: "Scan Soil",
    description: "Check soil condition",
    icon: SoilIcon,
    tone: "brown",
  },
  {
    title: "Scan Land",
    description: "Discover what to grow",
    icon: LandIcon,
    tone: "blue",
  },
  {
    title: "Show & Explain",
    description: "Record video with voice",
    icon: VideoIcon,
    tone: "purple",
  },
];

const recentPlants = [
  {
    name: "Tomato",
    location: "Terrace",
    health: 92,
    emoji: "🍅",
    status: "Healthy",
  },
  {
    name: "Rose",
    location: "Front garden",
    health: 74,
    emoji: "🌹",
    status: "Needs attention",
  },
  {
    name: "Mango",
    location: "Backyard",
    health: 88,
    emoji: "🌳",
    status: "Growing well",
  },
];

const tasks = [
  {
    title: "Water tomato plants",
    time: "Today, 6:00 PM",
    completed: false,
  },
  {
    title: "Recheck rose leaves",
    time: "Tomorrow",
    completed: false,
  },
  {
    title: "Soil moisture recorded",
    time: "Completed",
    completed: true,
  },
];

export default function Home() {
  const [darkMode, setDarkMode] = useState(false);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("plantverse-theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;

    const shouldUseDark =
      savedTheme === "dark" || (!savedTheme && prefersDark);

    setDarkMode(shouldUseDark);
    document.documentElement.classList.toggle("dark", shouldUseDark);
  }, []);

  function toggleTheme() {
    const nextTheme = !darkMode;

    setDarkMode(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme);
    localStorage.setItem("plantverse-theme", nextTheme ? "dark" : "light");
  }

  return (
    <div className="min-h-screen bg-[var(--app-background)] text-[var(--text-primary)]">
      <header className="sticky top-0 z-40 border-b border-[var(--border-color)] bg-[var(--header-background)]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-17 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="#" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--brand-primary)] text-white shadow-sm">
              <LeafIcon className="h-6 w-6" />
            </span>

            <div>
              <p className="text-lg font-semibold tracking-tight">
                PlantVerse AI
              </p>
              <p className="hidden text-xs text-[var(--text-secondary)] sm:block">
                One AI for everything that grows
              </p>
            </div>
          </a>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="icon-button"
              aria-label={
                darkMode ? "Switch to light mode" : "Switch to dark mode"
              }
            >
              {darkMode ? <SunIcon /> : <MoonIcon />}
            </button>

            <button
              type="button"
              className="flex h-10 items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--surface-primary)] px-2 pr-3 transition hover:border-[var(--brand-primary)]"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--brand-soft)] text-sm font-semibold text-[var(--brand-primary)]">
                D
              </span>
              <span className="hidden text-sm font-medium sm:inline">
                Dileep
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-12">
        <section className="hero-panel overflow-hidden rounded-[2rem] p-6 sm:p-8 lg:p-10">
          <div className="relative z-10 grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white/90 backdrop-blur">
                <SunIcon className="h-4 w-4" />
                Good evening, Dileep
              </div>

              <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Keep every plant healthy with one intelligent assistant.
              </h1>

              <p className="mt-4 max-w-xl text-base leading-7 text-white/75 sm:text-lg">
                Scan plants, understand soil, plan what to grow and remember
                every change in your garden.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button type="button" className="primary-light-button">
                  <CameraIcon className="h-5 w-5" />
                  Scan something
                </button>

                <button type="button" className="secondary-light-button">
                  Ask Plant AI
                  <ArrowIcon />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="hero-stat">
                <span className="text-sm text-white/65">Your plants</span>
                <strong className="mt-3 text-3xl font-semibold">24</strong>
                <span className="mt-2 text-xs text-emerald-100">
                  3 added this month
                </span>
              </div>

              <div className="hero-stat">
                <span className="text-sm text-white/65">Garden health</span>
                <strong className="mt-3 text-3xl font-semibold">89%</strong>
                <span className="mt-2 text-xs text-emerald-100">
                  Improving steadily
                </span>
              </div>

              <div className="hero-stat col-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-white/65">
                      Today&apos;s condition
                    </span>
                    <p className="mt-2 text-lg font-medium">
                      Warm with possible evening rain
                    </p>
                  </div>

                  <div className="text-right">
                    <strong className="text-3xl font-semibold">29°</strong>
                    <p className="mt-1 text-xs text-white/65">
                      Watering may be reduced
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Quick actions</p>
              <h2 className="section-title">What would you like to inspect?</h2>
            </div>

            <button type="button" className="text-button">
              View all
              <ArrowIcon />
            </button>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <button
                  key={action.title}
                  type="button"
                  className="feature-card text-left"
                >
                  <span className={`feature-icon feature-icon-${action.tone}`}>
                    <Icon />
                  </span>

                  <span className="mt-5 block text-lg font-medium">
                    {action.title}
                  </span>

                  <span className="mt-1 block text-sm text-[var(--text-secondary)]">
                    {action.description}
                  </span>

                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-[var(--brand-primary)]">
                    Start
                    <ArrowIcon />
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="dashboard-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Plant memory</p>
                <h2 className="section-title">Recent plants</h2>
              </div>

              <button type="button" className="text-button">
                My plants
                <ArrowIcon />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {recentPlants.map((plant) => (
                <button
                  key={plant.name}
                  type="button"
                  className="plant-row"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-secondary)] text-2xl">
                    {plant.emoji}
                  </span>

                  <span className="min-w-0 flex-1 text-left">
                    <span className="block font-medium">{plant.name}</span>
                    <span className="mt-1 block text-sm text-[var(--text-secondary)]">
                      {plant.location} · {plant.status}
                    </span>
                  </span>

                  <span className="health-pill">{plant.health}%</span>
                  <ArrowIcon className="h-4 w-4 text-[var(--text-tertiary)]" />
                </button>
              ))}
            </div>
          </div>

          <div className="dashboard-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Care calendar</p>
                <h2 className="section-title">Today&apos;s tasks</h2>
              </div>

              <CalendarIcon className="h-5 w-5 text-[var(--brand-primary)]" />
            </div>

            <div className="mt-5 space-y-3">
              {tasks.map((task) => (
                <label key={task.title} className="task-row">
                  <input
                    type="checkbox"
                    defaultChecked={task.completed}
                    className="task-checkbox"
                  />

                  <span className="min-w-0">
                    <span
                      className={`block text-sm font-medium ${
                        task.completed
                          ? "text-[var(--text-tertiary)] line-through"
                          : ""
                      }`}
                    >
                      {task.title}
                    </span>

                    <span className="mt-1 block text-xs text-[var(--text-secondary)]">
                      {task.time}
                    </span>
                  </span>
                </label>
              ))}
            </div>

            <button type="button" className="outline-button mt-5 w-full">
              Open care calendar
            </button>
          </div>
        </section>

        <section className="mt-8 dashboard-panel">
          <div className="grid items-center gap-6 lg:grid-cols-[1fr_auto]">
            <div>
              <p className="eyebrow">Plant AI</p>
              <h2 className="section-title mt-1">
                Tell us what you notice
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
                Speak naturally about a plant, soil, field or terrace. Plant AI
                will understand your intention and connect it with the current
                scan or result.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setListening((current) => !current)}
              className={`voice-button ${
                listening ? "voice-button-listening" : ""
              }`}
            >
              <MicrophoneIcon />
              {listening ? "Listening..." : "Speak to Plant AI"}
            </button>
          </div>
        </section>
      </main>

      <button
        type="button"
        onClick={() => setListening((current) => !current)}
        className={`floating-mic ${listening ? "floating-mic-listening" : ""}`}
        aria-label="Speak to Plant AI"
      >
        <MicrophoneIcon className="h-6 w-6" />
      </button>

      <nav className="mobile-navigation" aria-label="Main navigation">
        <a href="#" className="mobile-nav-item mobile-nav-item-active">
          <HomeIcon />
          <span>Home</span>
        </a>

        <a href="#" className="mobile-nav-item">
          <CameraIcon className="h-5 w-5" />
          <span>Scan</span>
        </a>

        <a href="#" className="mobile-nav-item">
          <LeafIcon className="h-5 w-5" />
          <span>Plants</span>
        </a>

        <a href="#" className="mobile-nav-item">
          <LandIcon className="h-5 w-5" />
          <span>Planner</span>
        </a>

        <a href="#" className="mobile-nav-item">
          <UserIcon />
          <span>Profile</span>
        </a>
      </nav>
    </div>
  );
}
