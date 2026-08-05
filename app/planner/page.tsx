"use client";

import { useState } from "react";

import PageIntro from "@/components/shared/PageIntro";

const spaces = ["Pot", "Terrace", "Field", "Empty land"] as const;

type Space = (typeof spaces)[number];
type Sunlight = "low" | "medium" | "high";
type Water = "low" | "medium" | "high";
type Soil = "potting" | "loamy" | "sandy" | "clayey";
type Season = "summer" | "monsoon" | "winter" | "year-round";

type PlantRule = {
  name: string;
  icon: string;
  sunlight: readonly Sunlight[];
  water: readonly Water[];
  soil: readonly Soil[];
  seasons: readonly Season[];
  spacingCm: number;
  unit: string;
  note: string;
};

type Recommendation = PlantRule & {
  score: number;
  estimatedCount: number;
  matchReasons: string[];
};

type GeneratedPlan = {
  area: number;
  recommendations: Recommendation[];
  irrigationAdvice: string;
};

const spaceIcons: Record<Space, string> = {
  Pot: "🪴",
  Terrace: "🏡",
  Field: "🌾",
  "Empty land": "🌳",
};

const sunlightLabels: Record<Sunlight, string> = {
  low: "Low — 2 to 4 hours",
  medium: "Medium — 4 to 6 hours",
  high: "High — more than 6 hours",
};

const waterLabels: Record<Water, string> = {
  low: "Limited",
  medium: "Regular",
  high: "Abundant",
};

const soilLabels: Record<Soil, string> = {
  potting: "Potting mix",
  loamy: "Loamy soil",
  sandy: "Sandy soil",
  clayey: "Clayey soil",
};

const seasonLabels: Record<Season, string> = {
  summer: "Summer",
  monsoon: "Monsoon",
  winter: "Winter",
  "year-round": "Year-round",
};

const plantRules: Record<Space, readonly PlantRule[]> = {
  Pot: [
    {
      name: "Tomato",
      icon: "🍅",
      sunlight: ["medium", "high"],
      water: ["medium", "high"],
      soil: ["potting", "loamy"],
      seasons: ["winter", "summer", "year-round"],
      spacingCm: 45,
      unit: "plants",
      note: "Use one deep container for each plant and provide support.",
    },
    {
      name: "Chilli",
      icon: "🌶️",
      sunlight: ["medium", "high"],
      water: ["medium"],
      soil: ["potting", "loamy", "sandy"],
      seasons: ["summer", "winter", "year-round"],
      spacingCm: 35,
      unit: "plants",
      note: "Use well-draining soil and avoid standing water.",
    },
    {
      name: "Mint",
      icon: "🌿",
      sunlight: ["low", "medium"],
      water: ["medium", "high"],
      soil: ["potting", "loamy"],
      seasons: ["winter", "monsoon", "year-round"],
      spacingCm: 25,
      unit: "plants",
      note: "Grow mint in a separate container because it spreads quickly.",
    },
    {
      name: "Tulsi",
      icon: "🌱",
      sunlight: ["medium", "high"],
      water: ["low", "medium"],
      soil: ["potting", "loamy", "sandy"],
      seasons: ["summer", "monsoon", "year-round"],
      spacingCm: 30,
      unit: "plants",
      note: "Allow airflow around the plant and avoid overwatering.",
    },
  ],

  Terrace: [
    {
      name: "Tomato",
      icon: "🍅",
      sunlight: ["medium", "high"],
      water: ["medium", "high"],
      soil: ["potting", "loamy"],
      seasons: ["winter", "summer", "year-round"],
      spacingCm: 50,
      unit: "plants",
      note: "Use grow bags or deep containers with support stakes.",
    },
    {
      name: "Okra",
      icon: "🌿",
      sunlight: ["high"],
      water: ["medium"],
      soil: ["loamy", "sandy", "potting"],
      seasons: ["summer", "monsoon"],
      spacingCm: 45,
      unit: "plants",
      note: "Keep containers in a sunny location with good drainage.",
    },
    {
      name: "Brinjal",
      icon: "🍆",
      sunlight: ["medium", "high"],
      water: ["medium"],
      soil: ["loamy", "potting"],
      seasons: ["summer", "winter", "year-round"],
      spacingCm: 55,
      unit: "plants",
      note: "Use large containers and inspect regularly for pests.",
    },
    {
      name: "Leafy greens",
      icon: "🥬",
      sunlight: ["low", "medium"],
      water: ["medium", "high"],
      soil: ["potting", "loamy"],
      seasons: ["winter", "monsoon", "year-round"],
      spacingCm: 20,
      unit: "plants",
      note: "Use shallow beds and provide afternoon shade in hot weather.",
    },
  ],

  Field: [
    {
      name: "Groundnut",
      icon: "🥜",
      sunlight: ["high"],
      water: ["low", "medium"],
      soil: ["sandy", "loamy"],
      seasons: ["summer", "monsoon"],
      spacingCm: 30,
      unit: "plants",
      note: "Best suited to loose, well-draining soil.",
    },
    {
      name: "Maize",
      icon: "🌽",
      sunlight: ["high"],
      water: ["medium"],
      soil: ["loamy", "sandy"],
      seasons: ["summer", "monsoon", "winter"],
      spacingCm: 50,
      unit: "plants",
      note: "Plant in blocks rather than single rows for better pollination.",
    },
    {
      name: "Paddy",
      icon: "🌾",
      sunlight: ["high"],
      water: ["high"],
      soil: ["clayey", "loamy"],
      seasons: ["monsoon"],
      spacingCm: 25,
      unit: "plants",
      note: "Requires reliable water and suitable field drainage management.",
    },
    {
      name: "Mixed vegetables",
      icon: "🥕",
      sunlight: ["medium", "high"],
      water: ["medium"],
      soil: ["loamy", "sandy"],
      seasons: ["summer", "winter", "year-round"],
      spacingCm: 40,
      unit: "plants",
      note: "Divide the field into crop beds and rotate crop families.",
    },
  ],

  "Empty land": [
    {
      name: "Fruit trees",
      icon: "🍋",
      sunlight: ["high"],
      water: ["medium"],
      soil: ["loamy", "sandy"],
      seasons: ["monsoon", "winter"],
      spacingCm: 450,
      unit: "trees",
      note: "Tree selection should match the local climate and soil depth.",
    },
    {
      name: "Native shade trees",
      icon: "🌳",
      sunlight: ["medium", "high"],
      water: ["low", "medium"],
      soil: ["loamy", "sandy", "clayey"],
      seasons: ["monsoon", "year-round"],
      spacingCm: 600,
      unit: "trees",
      note: "Prefer locally native species and keep clear of buildings and wires.",
    },
    {
      name: "Vegetable beds",
      icon: "🥬",
      sunlight: ["medium", "high"],
      water: ["medium"],
      soil: ["loamy", "sandy"],
      seasons: ["summer", "winter", "year-round"],
      spacingCm: 120,
      unit: "beds",
      note: "Create raised beds with access paths and compost-enriched soil.",
    },
    {
      name: "Pollinator garden",
      icon: "🌼",
      sunlight: ["medium", "high"],
      water: ["low", "medium"],
      soil: ["loamy", "sandy", "clayey"],
      seasons: ["monsoon", "winter", "year-round"],
      spacingCm: 100,
      unit: "plant groups",
      note: "Use multiple native flowering species with different bloom periods.",
    },
  ],
};

const fieldClass =
  "mt-2 min-h-12 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--surface-secondary)] px-4 outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-green-600/10";

function getScore(
  rule: PlantRule,
  sunlight: Sunlight,
  water: Water,
  soil: Soil,
  season: Season,
) {
  let score = 0;

  if (rule.sunlight.includes(sunlight)) score += 3;
  if (rule.water.includes(water)) score += 3;
  if (rule.soil.includes(soil)) score += 2;
  if (
    rule.seasons.includes(season) ||
    rule.seasons.includes("year-round")
  ) {
    score += 2;
  }

  return score;
}

function getMatchReasons(
  rule: PlantRule,
  sunlight: Sunlight,
  water: Water,
  soil: Soil,
  season: Season,
) {
  const reasons: string[] = [];

  if (rule.sunlight.includes(sunlight)) {
    reasons.push("Matches sunlight");
  }

  if (rule.water.includes(water)) {
    reasons.push("Matches water availability");
  }

  if (rule.soil.includes(soil)) {
    reasons.push("Matches soil");
  }

  if (
    rule.seasons.includes(season) ||
    rule.seasons.includes("year-round")
  ) {
    reasons.push("Suitable for season");
  }

  return reasons;
}

function estimateCapacity(
  space: Space,
  area: number,
  containerCount: number,
  spacingCm: number,
  recommendationCount: number,
) {
  if (space === "Pot") {
    return Math.max(1, Math.floor(containerCount / recommendationCount));
  }

  const usableArea = area * 0.7;
  const allocatedArea = usableArea / recommendationCount;
  const spacingMetres = Math.max(spacingCm / 100, 0.2);
  const requiredArea = spacingMetres * spacingMetres;

  return Math.max(1, Math.floor(allocatedArea / requiredArea));
}

export default function PlannerPage() {
  const [space, setSpace] = useState<Space>("Terrace");
  const [spaceMenuOpen, setSpaceMenuOpen] = useState(false);

  const [length, setLength] = useState("4");
  const [width, setWidth] = useState("3");
  const [containerCount, setContainerCount] = useState("8");
  const [sunlight, setSunlight] = useState<Sunlight>("high");
  const [water, setWater] = useState<Water>("medium");
  const [soil, setSoil] = useState<Soil>("loamy");
  const [season, setSeason] = useState<Season>("year-round");
  const [location, setLocation] = useState("");

  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const [formError, setFormError] = useState("");

  function selectSpace(nextSpace: Space) {
    setSpace(nextSpace);
    setSpaceMenuOpen(false);
    setPlan(null);
    setFormError("");
  }

  function generatePlan() {
    const lengthValue = Number(length);
    const widthValue = Number(width);
    const potsValue = Number(containerCount);

    if (
      !Number.isFinite(lengthValue) ||
      !Number.isFinite(widthValue) ||
      lengthValue <= 0 ||
      widthValue <= 0
    ) {
      setFormError("Enter valid length and width values greater than zero.");
      return;
    }

    if (
      space === "Pot" &&
      (!Number.isInteger(potsValue) || potsValue <= 0)
    ) {
      setFormError("Enter a valid number of available pots.");
      return;
    }

    const area = lengthValue * widthValue;

    const rankedRules = [...plantRules[space]]
      .map((rule) => ({
        rule,
        score: getScore(rule, sunlight, water, soil, season),
      }))
      .sort((first, second) => second.score - first.score);

    const selectedRules = rankedRules.slice(0, 4);

    const recommendations: Recommendation[] = selectedRules.map(
      ({ rule, score }) => ({
        ...rule,
        score,
        estimatedCount: estimateCapacity(
          space,
          area,
          potsValue,
          rule.spacingCm,
          selectedRules.length,
        ),
        matchReasons: getMatchReasons(
          rule,
          sunlight,
          water,
          soil,
          season,
        ),
      }),
    );

    const irrigationAdvice =
      water === "low"
        ? "Use drip irrigation, mulch and drought-tolerant plants. Check moisture before watering."
        : water === "high"
          ? "Provide drainage channels and avoid leaving roots in standing water."
          : "Use regular morning watering and adjust frequency after checking soil moisture.";

    setFormError("");
    setPlan({
      area,
      recommendations,
      irrigationAdvice,
    });
  }

  return (
    <main className="page-wrap">
      <PageIntro
        eyebrow="Growing-space modes"
        title="Grow Planner"
        description="Build a starter growing plan using your available space, dimensions, sunlight, water, soil and local season."
      />

      <div
        className="mt-8 hidden flex-wrap gap-2 sm:flex"
        role="group"
        aria-label="Growing space"
      >
        {spaces.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => selectSpace(item)}
            className={space === item ? "voice-button" : "outline-button"}
            aria-pressed={space === item}
          >
            <span aria-hidden="true">{spaceIcons[item]}</span>
            <span className="ml-2">{item}</span>
          </button>
        ))}
      </div>

      <div className="relative mt-8 sm:hidden">
        <p className="mb-2 text-sm font-medium">Growing space</p>

        <button
          type="button"
          onClick={() => setSpaceMenuOpen((current) => !current)}
          className="flex min-h-14 w-full items-center justify-between rounded-2xl border border-[var(--border-color)] bg-[var(--surface-primary)] px-4 text-left font-semibold shadow-sm"
          aria-haspopup="listbox"
          aria-expanded={spaceMenuOpen}
        >
          <span className="flex items-center gap-3">
            <span className="text-xl" aria-hidden="true">
              {spaceIcons[space]}
            </span>
            {space}
          </span>

          <svg
            viewBox="0 0 24 24"
            className={`h-5 w-5 transition ${
              spaceMenuOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {spaceMenuOpen ? (
          <div
            role="listbox"
            aria-label="Select growing space"
            className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--surface-primary)] p-2 shadow-[var(--shadow-lg)]"
          >
            {spaces.map((item) => {
              const selected = item === space;

              return (
                <button
                  key={item}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => selectSpace(item)}
                  className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition ${
                    selected
                      ? "bg-green-600 text-white"
                      : "hover:bg-[var(--surface-secondary)]"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-xl" aria-hidden="true">
                      {spaceIcons[item]}
                    </span>
                    <span className="font-medium">{item}</span>
                  </span>

                  {selected ? (
                    <span aria-hidden="true">✓</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <section className="dashboard-panel">
          <p className="eyebrow">Your growing conditions</p>
          <h2 className="mt-2 text-2xl font-semibold">Enter site details</h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              Length in metres
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={length}
                onChange={(event) => setLength(event.target.value)}
                className={fieldClass}
              />
            </label>

            <label className="block text-sm font-medium">
              Width in metres
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={width}
                onChange={(event) => setWidth(event.target.value)}
                className={fieldClass}
              />
            </label>

            {space === "Pot" ? (
              <label className="block text-sm font-medium sm:col-span-2">
                Number of available pots
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={containerCount}
                  onChange={(event) => setContainerCount(event.target.value)}
                  className={fieldClass}
                />
              </label>
            ) : null}

            <label className="block text-sm font-medium">
              Daily sunlight
              <select
                value={sunlight}
                onChange={(event) =>
                  setSunlight(event.target.value as Sunlight)
                }
                className={fieldClass}
              >
                {Object.entries(sunlightLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium">
              Water availability
              <select
                value={water}
                onChange={(event) =>
                  setWater(event.target.value as Water)
                }
                className={fieldClass}
              >
                {Object.entries(waterLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium">
              Soil type
              <select
                value={soil}
                onChange={(event) =>
                  setSoil(event.target.value as Soil)
                }
                className={fieldClass}
              >
                {Object.entries(soilLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium">
              Current season
              <select
                value={season}
                onChange={(event) =>
                  setSeason(event.target.value as Season)
                }
                className={fieldClass}
              >
                {Object.entries(seasonLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium sm:col-span-2">
              Location
              <input
                type="text"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Example: Hyderabad, Telangana"
                className={fieldClass}
              />
            </label>
          </div>

          {formError ? (
            <div
              className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
              role="alert"
            >
              {formError}
            </div>
          ) : null}

          <button
            type="button"
            onClick={generatePlan}
            className="voice-button mt-6 w-full"
          >
            {plan ? "Update growing plan" : "Generate growing plan"}
          </button>
        </section>

        <section className="dashboard-panel">
          <p className="eyebrow">
            {plan
              ? `Plan for ${space}`
              : `Starter candidates for ${space}`}
          </p>

          <h2 className="mt-2 text-2xl font-semibold">
            {plan ? "Suggested growing plan" : "Complete the site details"}
          </h2>

          {plan ? (
            <>
              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                <span className="rounded-full bg-[var(--surface-secondary)] px-3 py-2">
                  {plan.area.toFixed(1)} m²
                </span>

                <span className="rounded-full bg-[var(--surface-secondary)] px-3 py-2">
                  {sunlightLabels[sunlight]}
                </span>

                <span className="rounded-full bg-[var(--surface-secondary)] px-3 py-2">
                  {seasonLabels[season]}
                </span>

                {location.trim() ? (
                  <span className="rounded-full bg-[var(--surface-secondary)] px-3 py-2">
                    📍 {location.trim()}
                  </span>
                ) : null}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {plan.recommendations.map((item) => (
                  <article
                    key={item.name}
                    className="rounded-3xl border border-[var(--border-color)] bg-[var(--surface-secondary)] p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-3xl" aria-hidden="true">
                          {item.icon}
                        </div>
                        <h3 className="mt-3 text-lg font-semibold">
                          {item.name}
                        </h3>
                      </div>

                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800 dark:bg-green-500/15 dark:text-green-200">
                        {item.score}/10 match
                      </span>
                    </div>

                    <p className="mt-3 text-sm font-medium">
                      Estimated capacity: {item.estimatedCount} {item.unit}
                    </p>

                    <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                      {item.note}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.matchReasons.map((reason) => (
                        <span
                          key={reason}
                          className="rounded-full border border-green-600/20 px-2.5 py-1 text-xs text-green-700 dark:text-green-300"
                        >
                          ✓ {reason}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-green-600/20 bg-green-50 p-4 text-sm leading-6 text-green-900 dark:bg-green-500/10 dark:text-green-100">
                <strong>Water plan:</strong> {plan.irrigationAdvice}
              </div>
            </>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-3">
              {plantRules[space].map((item) => (
                <div
                  key={item.name}
                  className="flex min-h-28 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-green-600/30 bg-[var(--surface-secondary)] p-3 text-center"
                >
                  <span className="text-3xl" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="mt-2 font-medium">{item.name}</span>
                </div>
              ))}
            </div>
          )}

          <p className="mt-5 text-sm leading-6 text-[var(--text-secondary)]">
            This planner provides an initial estimate, not a professional crop
            prescription. Confirm recommendations using local weather, soil
            testing, drainage and agricultural guidance before purchasing
            plants or seeds.
          </p>
        </section>
      </div>
    </main>
  );
}