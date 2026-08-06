"use client";

import {
  Check,
  ChevronDown,
  Globe2,
  LoaderCircle,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const spaces = ["Pot", "Terrace", "Field", "Empty land"] as const;
const categories = [
  "All",
  "Vegetables",
  "Herbs",
  "Fruits",
  "Flowers",
  "Trees",
  "Field crops",
] as const;

type Space = (typeof spaces)[number];
type Category = (typeof categories)[number];
type PlantCategory = Exclude<Category, "All">;
type PlanningMode = "choose" | "suggest";
type MeasurementMode = "shape" | "area";
type PlotShape = "rectangle" | "circle" | "four-sides";
type LengthUnit = "m" | "ft" | "cm" | "yd";
type AreaUnit = "m2" | "ft2" | "yd2" | "acre" | "hectare";
type Sunlight = "low" | "medium" | "high";
type Water = "low" | "medium" | "high";
type Soil = "potting" | "loamy" | "sandy" | "clayey";
type Season = "summer" | "monsoon" | "winter" | "year-round";

type PlantRule = {
  id: string;
  name: string;
  icon: string;
  category: PlantCategory;
  spaces: readonly Space[];
  sunlight: readonly Sunlight[];
  water: readonly Water[];
  soil: readonly Soil[];
  seasons: readonly Season[];
  spacingCm: number;
  unit: string;
  note: string;
  aliases?: readonly string[];
  source?: "local" | "global";
};

type Recommendation = PlantRule & {
  score: number;
  estimatedCount: number;
  matchReasons: string[];
  warnings: string[];
};

type GeneratedPlan = {
  areaSquareMetres: number;
  recommendations: Recommendation[];
  irrigationAdvice: string;
  mode: PlanningMode;
};

type GlobalSearchStatus = "idle" | "loading" | "found" | "not-found" | "error";

type SelectOption<T extends string> = {
  value: T;
  label: string;
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

const lengthUnitLabels: Record<LengthUnit, string> = {
  m: "Metres",
  ft: "Feet",
  cm: "Centimetres",
  yd: "Yards",
};

const areaUnitLabels: Record<AreaUnit, string> = {
  m2: "Square metres",
  ft2: "Square feet",
  yd2: "Square yards",
  acre: "Acres",
  hectare: "Hectares",
};

const plotShapeLabels: Record<PlotShape, string> = {
  rectangle: "Rectangle / square",
  circle: "Circle",
  "four-sides": "Four-sided plot",
};

function CustomSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly SelectOption<T>[];
  onChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <p className="text-sm font-medium">{label}</p>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="mt-2 flex min-h-12 w-full items-center justify-between rounded-2xl border border-[var(--border-color)] bg-[var(--surface-secondary)] px-4 text-left outline-none transition hover:border-green-600/50 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-green-600/10"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="min-w-0 truncate">{selected?.label}</span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-[var(--text-secondary)] transition ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label={label}
          className="absolute z-50 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-[var(--border-color)] bg-[var(--surface-primary)] p-2 shadow-[var(--shadow-lg)]"
        >
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition ${
                  isSelected
                    ? "bg-[var(--brand-primary)] text-white"
                    : "hover:bg-[var(--surface-secondary)]"
                }`}
              >
                <span>{option.label}</span>
                {isSelected ? <Check size={17} aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

const plantCatalog: readonly PlantRule[] = [
  {
    id: "tomato",
    name: "Tomato",
    icon: "🍅",
    category: "Vegetables",
    spaces: ["Pot", "Terrace", "Field", "Empty land"],
    sunlight: ["medium", "high"],
    water: ["medium", "high"],
    soil: ["potting", "loamy"],
    seasons: ["summer", "winter", "year-round"],
    spacingCm: 50,
    unit: "plants",
    note: "Provide support and use well-draining soil.",
  },
  {
    id: "chilli",
    name: "Chilli",
    icon: "🌶️",
    category: "Vegetables",
    spaces: ["Pot", "Terrace", "Field", "Empty land"],
    sunlight: ["medium", "high"],
    water: ["medium"],
    soil: ["potting", "loamy", "sandy"],
    seasons: ["summer", "winter", "year-round"],
    spacingCm: 40,
    unit: "plants",
    note: "Avoid waterlogging and keep the plant in good light.",
  },
  {
    id: "brinjal",
    name: "Brinjal",
    icon: "🍆",
    category: "Vegetables",
    spaces: ["Pot", "Terrace", "Field", "Empty land"],
    sunlight: ["medium", "high"],
    water: ["medium"],
    soil: ["potting", "loamy"],
    seasons: ["summer", "winter", "year-round"],
    spacingCm: 55,
    unit: "plants",
    note: "Use deep containers or beds and inspect regularly for pests.",
  },
  {
    id: "okra",
    name: "Okra",
    icon: "🌿",
    category: "Vegetables",
    spaces: ["Pot", "Terrace", "Field", "Empty land"],
    sunlight: ["high"],
    water: ["medium"],
    soil: ["potting", "loamy", "sandy"],
    seasons: ["summer", "monsoon"],
    spacingCm: 45,
    unit: "plants",
    note: "Best growth usually needs strong sunlight and good drainage.",
  },
  {
    id: "spinach",
    name: "Spinach",
    icon: "🥬",
    category: "Vegetables",
    spaces: ["Pot", "Terrace", "Field", "Empty land"],
    sunlight: ["low", "medium"],
    water: ["medium", "high"],
    soil: ["potting", "loamy"],
    seasons: ["winter", "monsoon", "year-round"],
    spacingCm: 20,
    unit: "plants",
    note: "Use shallow beds and protect from intense afternoon heat.",
  },
  {
    id: "coriander",
    name: "Coriander",
    icon: "🌿",
    category: "Herbs",
    spaces: ["Pot", "Terrace", "Field", "Empty land"],
    sunlight: ["low", "medium"],
    water: ["medium"],
    soil: ["potting", "loamy", "sandy"],
    seasons: ["winter", "monsoon", "year-round"],
    spacingCm: 15,
    unit: "plants",
    note: "Sow in batches for a more continuous harvest.",
  },
  {
    id: "mint",
    name: "Mint",
    icon: "🌱",
    category: "Herbs",
    spaces: ["Pot", "Terrace", "Empty land"],
    sunlight: ["low", "medium"],
    water: ["medium", "high"],
    soil: ["potting", "loamy"],
    seasons: ["winter", "monsoon", "year-round"],
    spacingCm: 25,
    unit: "plants",
    note: "Keep mint contained because it spreads quickly.",
  },
  {
    id: "tulsi",
    name: "Tulsi",
    icon: "🌿",
    category: "Herbs",
    spaces: ["Pot", "Terrace", "Empty land"],
    sunlight: ["medium", "high"],
    water: ["low", "medium"],
    soil: ["potting", "loamy", "sandy"],
    seasons: ["summer", "monsoon", "year-round"],
    spacingCm: 30,
    unit: "plants",
    note: "Allow airflow and avoid frequent overwatering.",
  },
  {
    id: "curry-leaf",
    name: "Curry leaf",
    icon: "🍃",
    category: "Herbs",
    spaces: ["Pot", "Terrace", "Empty land"],
    sunlight: ["medium", "high"],
    water: ["low", "medium"],
    soil: ["potting", "loamy", "sandy"],
    seasons: ["summer", "monsoon", "year-round"],
    spacingCm: 120,
    unit: "plants",
    note: "Use a deep container or open soil with good drainage.",
  },
  {
    id: "radish",
    name: "Radish",
    icon: "🔴",
    category: "Vegetables",
    spaces: ["Pot", "Terrace", "Field", "Empty land"],
    sunlight: ["medium", "high"],
    water: ["medium"],
    soil: ["potting", "loamy", "sandy"],
    seasons: ["winter"],
    spacingCm: 15,
    unit: "plants",
    note: "Loose soil helps roots develop without obstruction.",
  },
  {
    id: "carrot",
    name: "Carrot",
    icon: "🥕",
    category: "Vegetables",
    spaces: ["Pot", "Terrace", "Field", "Empty land"],
    sunlight: ["medium", "high"],
    water: ["medium"],
    soil: ["potting", "loamy", "sandy"],
    seasons: ["winter"],
    spacingCm: 12,
    unit: "plants",
    note: "Use deep, loose soil without stones or compacted layers.",
  },
  {
    id: "cucumber",
    name: "Cucumber",
    icon: "🥒",
    category: "Vegetables",
    spaces: ["Pot", "Terrace", "Field", "Empty land"],
    sunlight: ["high"],
    water: ["medium", "high"],
    soil: ["potting", "loamy", "sandy"],
    seasons: ["summer", "monsoon"],
    spacingCm: 60,
    unit: "plants",
    note: "Provide a trellis where possible and maintain steady moisture.",
  },
  {
    id: "beans",
    name: "Beans",
    icon: "🫘",
    category: "Vegetables",
    spaces: ["Pot", "Terrace", "Field", "Empty land"],
    sunlight: ["medium", "high"],
    water: ["medium"],
    soil: ["potting", "loamy", "sandy"],
    seasons: ["summer", "winter", "year-round"],
    spacingCm: 30,
    unit: "plants",
    note: "Climbing types need support; bush types need more bed space.",
  },
  {
    id: "bottle-gourd",
    name: "Bottle gourd",
    icon: "🥒",
    category: "Vegetables",
    spaces: ["Terrace", "Field", "Empty land"],
    sunlight: ["high"],
    water: ["medium", "high"],
    soil: ["loamy", "potting"],
    seasons: ["summer", "monsoon"],
    spacingCm: 150,
    unit: "plants",
    note: "Provide a strong trellis and enough room for vines.",
  },
  {
    id: "marigold",
    name: "Marigold",
    icon: "🌼",
    category: "Flowers",
    spaces: ["Pot", "Terrace", "Field", "Empty land"],
    sunlight: ["medium", "high"],
    water: ["low", "medium"],
    soil: ["potting", "loamy", "sandy"],
    seasons: ["summer", "winter", "year-round"],
    spacingCm: 30,
    unit: "plants",
    note: "Useful around vegetable beds and suitable for sunny positions.",
  },
  {
    id: "rose",
    name: "Rose",
    icon: "🌹",
    category: "Flowers",
    spaces: ["Pot", "Terrace", "Empty land"],
    sunlight: ["medium", "high"],
    water: ["medium"],
    soil: ["potting", "loamy"],
    seasons: ["winter", "year-round"],
    spacingCm: 90,
    unit: "plants",
    note: "Provide airflow, drainage and regular inspection for pests.",
  },
  {
    id: "jasmine",
    name: "Jasmine",
    icon: "🌸",
    category: "Flowers",
    spaces: ["Pot", "Terrace", "Field", "Empty land"],
    sunlight: ["medium", "high"],
    water: ["medium"],
    soil: ["potting", "loamy", "sandy"],
    seasons: ["summer", "monsoon", "year-round"],
    spacingCm: 120,
    unit: "plants",
    note: "Some types need support and room to spread.",
  },
  {
    id: "sunflower",
    name: "Sunflower",
    icon: "🌻",
    category: "Flowers",
    spaces: ["Pot", "Terrace", "Field", "Empty land"],
    sunlight: ["high"],
    water: ["low", "medium"],
    soil: ["potting", "loamy", "sandy"],
    seasons: ["summer", "winter"],
    spacingCm: 45,
    unit: "plants",
    note: "Choose a sunny location and protect tall varieties from wind.",
  },
  {
    id: "strawberry",
    name: "Strawberry",
    icon: "🍓",
    category: "Fruits",
    spaces: ["Pot", "Terrace"],
    sunlight: ["medium", "high"],
    water: ["medium"],
    soil: ["potting", "loamy"],
    seasons: ["winter"],
    spacingCm: 30,
    unit: "plants",
    note: "Use well-draining soil and keep fruit away from wet soil.",
  },
  {
    id: "lemon",
    name: "Lemon",
    icon: "🍋",
    category: "Fruits",
    spaces: ["Pot", "Terrace", "Empty land"],
    sunlight: ["high"],
    water: ["medium"],
    soil: ["potting", "loamy", "sandy"],
    seasons: ["monsoon", "winter", "year-round"],
    spacingCm: 300,
    unit: "trees",
    note: "Container varieties need large pots and regular feeding.",
  },
  {
    id: "guava",
    name: "Guava",
    icon: "🍈",
    category: "Fruits",
    spaces: ["Terrace", "Field", "Empty land"],
    sunlight: ["high"],
    water: ["low", "medium"],
    soil: ["loamy", "sandy", "clayey"],
    seasons: ["monsoon", "winter", "year-round"],
    spacingCm: 450,
    unit: "trees",
    note: "Use open ground or a very large container with enough root room.",
  },
  {
    id: "papaya",
    name: "Papaya",
    icon: "🧡",
    category: "Fruits",
    spaces: ["Terrace", "Field", "Empty land"],
    sunlight: ["high"],
    water: ["medium"],
    soil: ["loamy", "sandy"],
    seasons: ["summer", "monsoon", "year-round"],
    spacingCm: 220,
    unit: "plants",
    note: "Good drainage is essential because roots dislike standing water.",
  },
  {
    id: "banana",
    name: "Banana",
    icon: "🍌",
    category: "Fruits",
    spaces: ["Field", "Empty land"],
    sunlight: ["high"],
    water: ["high"],
    soil: ["loamy", "clayey"],
    seasons: ["monsoon", "year-round"],
    spacingCm: 220,
    unit: "plants",
    note: "Requires reliable water, nutrients and protection from strong wind.",
  },
  {
    id: "mango",
    name: "Mango",
    icon: "🥭",
    category: "Trees",
    spaces: ["Field", "Empty land"],
    sunlight: ["high"],
    water: ["low", "medium"],
    soil: ["loamy", "sandy", "clayey"],
    seasons: ["monsoon", "winter"],
    spacingCm: 800,
    unit: "trees",
    note: "Allow substantial spacing and keep clear of buildings and cables.",
  },
  {
    id: "coconut",
    name: "Coconut",
    icon: "🥥",
    category: "Trees",
    spaces: ["Field", "Empty land"],
    sunlight: ["high"],
    water: ["medium", "high"],
    soil: ["sandy", "loamy"],
    seasons: ["monsoon", "year-round"],
    spacingCm: 750,
    unit: "trees",
    note: "Suitability depends strongly on local climate, water and soil depth.",
  },
  {
    id: "drumstick",
    name: "Drumstick",
    icon: "🌿",
    category: "Trees",
    spaces: ["Terrace", "Field", "Empty land"],
    sunlight: ["high"],
    water: ["low", "medium"],
    soil: ["sandy", "loamy"],
    seasons: ["summer", "monsoon", "year-round"],
    spacingCm: 300,
    unit: "trees",
    note: "Prefers good drainage and can tolerate relatively dry conditions.",
  },
  {
    id: "neem",
    name: "Neem",
    icon: "🌳",
    category: "Trees",
    spaces: ["Field", "Empty land"],
    sunlight: ["high"],
    water: ["low", "medium"],
    soil: ["sandy", "loamy", "clayey"],
    seasons: ["monsoon", "year-round"],
    spacingCm: 700,
    unit: "trees",
    note: "Use only where a mature tree has enough safe open space.",
  },
  {
    id: "paddy",
    name: "Paddy",
    icon: "🌾",
    category: "Field crops",
    spaces: ["Field", "Empty land"],
    sunlight: ["high"],
    water: ["high"],
    soil: ["clayey", "loamy"],
    seasons: ["monsoon"],
    spacingCm: 25,
    unit: "plants",
    note: "Requires suitable water management and field preparation.",
  },
  {
    id: "maize",
    name: "Maize",
    icon: "🌽",
    category: "Field crops",
    spaces: ["Field", "Empty land"],
    sunlight: ["high"],
    water: ["medium"],
    soil: ["loamy", "sandy"],
    seasons: ["summer", "monsoon", "winter"],
    spacingCm: 50,
    unit: "plants",
    note: "Plant in blocks where possible for better pollination.",
  },
  {
    id: "groundnut",
    name: "Groundnut",
    icon: "🥜",
    category: "Field crops",
    spaces: ["Field", "Empty land"],
    sunlight: ["high"],
    water: ["low", "medium"],
    soil: ["sandy", "loamy"],
    seasons: ["summer", "monsoon"],
    spacingCm: 30,
    unit: "plants",
    note: "Loose, well-draining soil generally supports better pod development.",
  },
  {
    id: "cotton",
    name: "Cotton",
    icon: "☁️",
    category: "Field crops",
    spaces: ["Field", "Empty land"],
    sunlight: ["high"],
    water: ["low", "medium"],
    soil: ["loamy", "clayey"],
    seasons: ["monsoon"],
    spacingCm: 75,
    unit: "plants",
    note: "Confirm variety, sowing time and pest management locally.",
  },
  {
    id: "red-gram",
    name: "Red gram",
    icon: "🫘",
    category: "Field crops",
    spaces: ["Field", "Empty land"],
    sunlight: ["high"],
    water: ["low", "medium"],
    soil: ["loamy", "sandy", "clayey"],
    seasons: ["monsoon"],
    spacingCm: 90,
    unit: "plants",
    note: "Often suited to lower-water systems but local variety matters.",
  },
  {
    id: "green-gram",
    name: "Green gram",
    icon: "🫘",
    category: "Field crops",
    spaces: ["Field", "Empty land"],
    sunlight: ["high"],
    water: ["low", "medium"],
    soil: ["loamy", "sandy"],
    seasons: ["summer", "monsoon"],
    spacingCm: 30,
    unit: "plants",
    note: "Avoid waterlogging and confirm sowing window locally.",
  },
  {
    id: "sorghum",
    name: "Sorghum",
    icon: "🌾",
    category: "Field crops",
    spaces: ["Field", "Empty land"],
    sunlight: ["high"],
    water: ["low", "medium"],
    soil: ["loamy", "sandy", "clayey"],
    seasons: ["summer", "monsoon"],
    spacingCm: 45,
    unit: "plants",
    note: "Can suit relatively dry conditions, depending on variety.",
  },
  {
    id: "millet",
    name: "Millet",
    icon: "🌾",
    category: "Field crops",
    spaces: ["Field", "Empty land"],
    sunlight: ["high"],
    water: ["low", "medium"],
    soil: ["sandy", "loamy"],
    seasons: ["summer", "monsoon"],
    spacingCm: 30,
    unit: "plants",
    note: "Confirm the locally suitable millet type and sowing period.",
  },
  {
    id: "sugarcane",
    name: "Sugarcane",
    icon: "🎋",
    category: "Field crops",
    spaces: ["Field", "Empty land"],
    sunlight: ["high"],
    water: ["high"],
    soil: ["loamy", "clayey"],
    seasons: ["monsoon", "year-round"],
    spacingCm: 100,
    unit: "plants",
    note: "Requires dependable water and a locally suitable planting schedule.",
  },
];

const inputClass =
  "mt-2 min-h-12 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--surface-secondary)] px-4 outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-green-600/10";

function scorePlant(
  rule: PlantRule,
  space: Space,
  sunlight: Sunlight,
  water: Water,
  soil: Soil,
  season: Season,
) {
  let score = 0;

  if (rule.spaces.includes(space)) score += 2;
  if (rule.sunlight.includes(sunlight)) score += 2;
  if (rule.water.includes(water)) score += 2;
  if (rule.soil.includes(soil)) score += 2;

  if (
    rule.seasons.includes(season) ||
    rule.seasons.includes("year-round")
  ) {
    score += 2;
  }

  return score;
}

function getMatchDetails(
  rule: PlantRule,
  space: Space,
  sunlight: Sunlight,
  water: Water,
  soil: Soil,
  season: Season,
) {
  const matchReasons: string[] = [];
  const warnings: string[] = [];

  if (rule.spaces.includes(space)) {
    matchReasons.push(`${space} is a suitable growing space`);
  } else {
    warnings.push(
      `${rule.name} is not normally recommended for ${space.toLowerCase()}. Use a suitable container, root space and structural support before proceeding.`,
    );
  }

  if (rule.sunlight.includes(sunlight)) {
    matchReasons.push("Sunlight matches");
  } else {
    warnings.push("Sunlight may not be ideal");
  }

  if (rule.water.includes(water)) {
    matchReasons.push("Water level matches");
  } else {
    warnings.push("Water availability may need adjustment");
  }

  if (rule.soil.includes(soil)) {
    matchReasons.push("Soil matches");
  } else {
    warnings.push("Soil may need amendment or a different growing medium");
  }

  if (
    rule.seasons.includes(season) ||
    rule.seasons.includes("year-round")
  ) {
    matchReasons.push("Season matches");
  } else {
    warnings.push("The selected season may not be ideal");
  }

  return {
    matchReasons,
    warnings,
  };
}

function lengthToMetres(value: number, unit: LengthUnit) {
  if (unit === "ft") return value * 0.3048;
  if (unit === "cm") return value / 100;
  if (unit === "yd") return value * 0.9144;
  return value;
}

function areaToSquareMetres(value: number, unit: AreaUnit) {
  if (unit === "ft2") return value * 0.09290304;
  if (unit === "yd2") return value * 0.83612736;
  if (unit === "acre") return value * 4046.8564224;
  if (unit === "hectare") return value * 10000;
  return value;
}

function triangleAreaFromSides(a: number, b: number, c: number) {
  if (a <= 0 || b <= 0 || c <= 0) return null;
  if (a + b <= c || a + c <= b || b + c <= a) return null;

  const semiPerimeter = (a + b + c) / 2;
  const squaredArea =
    semiPerimeter *
    (semiPerimeter - a) *
    (semiPerimeter - b) *
    (semiPerimeter - c);

  return squaredArea > 0 ? Math.sqrt(squaredArea) : null;
}

function estimateCapacity(
  space: Space,
  areaSquareMetres: number,
  containerCount: number,
  spacingCm: number,
  resultCount: number,
) {
  if (space === "Pot") {
    return Math.max(1, Math.floor(containerCount / Math.max(resultCount, 1)));
  }

  const usableArea = areaSquareMetres * 0.7;
  const allocatedArea = usableArea / Math.max(resultCount, 1);
  const spacingMetres = Math.max(spacingCm / 100, 0.15);
  const requiredArea = spacingMetres * spacingMetres;

  return Math.max(1, Math.floor(allocatedArea / requiredArea));
}

export default function PlannerPage() {
  const [space, setSpace] = useState<Space>("Terrace");
  const [spaceMenuOpen, setSpaceMenuOpen] = useState(false);
  const [planningMode, setPlanningMode] =
    useState<PlanningMode>("suggest");

  const [category, setCategory] = useState<Category>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlantIds, setSelectedPlantIds] = useState<string[]>([]);
  const [globalPlants, setGlobalPlants] = useState<PlantRule[]>([]);
  const [globalSearchStatus, setGlobalSearchStatus] =
    useState<GlobalSearchStatus>("idle");
  const [globalSearchError, setGlobalSearchError] = useState("");
  const searchedGlobalQueries = useRef(new Set<string>());

  const [measurementMode, setMeasurementMode] =
    useState<MeasurementMode>("shape");
  const [plotShape, setPlotShape] = useState<PlotShape>("rectangle");
  const [length, setLength] = useState("4");
  const [width, setWidth] = useState("3");
  const [circleDiameter, setCircleDiameter] = useState("4");
  const [frontSide, setFrontSide] = useState("4");
  const [backSide, setBackSide] = useState("4");
  const [leftSide, setLeftSide] = useState("3");
  const [rightSide, setRightSide] = useState("3");
  const [plotDiagonal, setPlotDiagonal] = useState("");
  const [lengthUnit, setLengthUnit] = useState<LengthUnit>("m");
  const [totalArea, setTotalArea] = useState("12");
  const [areaUnit, setAreaUnit] = useState<AreaUnit>("m2");
  const [containerCount, setContainerCount] = useState("8");
  const [potDiameter, setPotDiameter] = useState("30");

  const [sunlight, setSunlight] = useState<Sunlight>("high");
  const [water, setWater] = useState<Water>("medium");
  const [soil, setSoil] = useState<Soil>("loamy");
  const [season, setSeason] = useState<Season>("year-round");
  const [location, setLocation] = useState("");

  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const [formError, setFormError] = useState("");

  const fullCatalog = useMemo(() => {
    const merged = [...plantCatalog, ...globalPlants];
    const seen = new Set<string>();

    return merged.filter((plant) => {
      const key = plant.name.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [globalPlants]);

  const availablePlants = useMemo(
    () =>
      fullCatalog.filter((plant) =>
        plant.spaces.includes(space),
      ),
    [fullCatalog, space],
  );

  const filteredPlants = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const source = planningMode === "choose" ? fullCatalog : availablePlants;

    return source.filter((plant) => {
      const matchesCategory =
        category === "All" || plant.category === category;
      const searchableText = [
        plant.name,
        plant.category,
        ...(plant.aliases ?? []),
      ]
        .join(" ")
        .toLowerCase();

      return matchesCategory && (!query || searchableText.includes(query));
    });
  }, [availablePlants, category, fullCatalog, planningMode, searchQuery]);

  const selectedPlants = useMemo(
    () =>
      selectedPlantIds
        .map((id) =>
          fullCatalog.find((plant) => plant.id === id),
        )
        .filter((plant): plant is PlantRule => Boolean(plant)),
    [fullCatalog, selectedPlantIds],
  );

  const searchGlobalPlant = useCallback(async (query: string, force = false) => {
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 2) return;

    const searchKey = `${space}|${category}|${normalizedQuery.toLowerCase()}`;
    if (!force && searchedGlobalQueries.current.has(searchKey)) return;

    searchedGlobalQueries.current.add(searchKey);
    setGlobalSearchStatus("loading");
    setGlobalSearchError("");

    try {
      const response = await fetch("/api/plants/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          query: normalizedQuery,
          space,
          category: category === "All" ? undefined : category,
          location: location.trim() || undefined,
        }),
      });

      const data = (await response.json()) as {
        plant?: PlantRule;
        error?: string;
      };

      if (response.status === 404) {
        setGlobalSearchStatus("not-found");
        return;
      }

      if (!response.ok || !data.plant) {
        throw new Error(data.error || "Global plant search failed.");
      }

      const globalPlant: PlantRule = {
        ...data.plant,
        source: "global",
      };

      setGlobalPlants((current) => {
        const exists = current.some(
          (plant) =>
            plant.name.toLowerCase() === globalPlant.name.toLowerCase(),
        );
        return exists ? current : [...current, globalPlant];
      });
      setGlobalSearchStatus("found");
    } catch (requestError) {
      setGlobalSearchStatus("error");
      setGlobalSearchError(
        requestError instanceof Error
          ? requestError.message
          : "Global plant search failed.",
      );
    }
  }, [category, location, space]);

  // Global search is started only after the user explicitly requests it.
  // This prevents a new paid/quota-limited AI request for every partially typed query.

  function selectSpace(nextSpace: Space) {
    setSpace(nextSpace);
    setSpaceMenuOpen(false);
    setPlan(null);
    setFormError("");
    setGlobalSearchStatus("idle");
    setGlobalSearchError("");
  }

  function changePlanningMode(nextMode: PlanningMode) {
    setPlanningMode(nextMode);
    setPlan(null);
    setFormError("");
    setGlobalSearchStatus("idle");
    setGlobalSearchError("");
  }

  function togglePlant(plantId: string) {
    setSelectedPlantIds((current) =>
      current.includes(plantId)
        ? current.filter((id) => id !== plantId)
        : [...current, plantId],
    );
    setPlan(null);
    setFormError("");
  }

  function getAreaSquareMetres() {
    if (space === "Pot") {
      const potsValue = Number(containerCount);
      const diameterValue = Number(potDiameter);

      if (
        !Number.isInteger(potsValue) ||
        potsValue <= 0 ||
        !Number.isFinite(diameterValue) ||
        diameterValue <= 0
      ) {
        return null;
      }

      const diameterMetres = lengthToMetres(diameterValue, lengthUnit);
      const radiusMetres = diameterMetres / 2;
      return potsValue * Math.PI * radiusMetres * radiusMetres;
    }

    if (measurementMode === "area") {
      const areaValue = Number(totalArea);

      if (!Number.isFinite(areaValue) || areaValue <= 0) {
        return null;
      }

      return areaToSquareMetres(areaValue, areaUnit);
    }

    if (plotShape === "rectangle") {
      const lengthValue = Number(length);
      const widthValue = Number(width);

      if (
        !Number.isFinite(lengthValue) ||
        !Number.isFinite(widthValue) ||
        lengthValue <= 0 ||
        widthValue <= 0
      ) {
        return null;
      }

      return (
        lengthToMetres(lengthValue, lengthUnit) *
        lengthToMetres(widthValue, lengthUnit)
      );
    }

    if (plotShape === "circle") {
      const diameterValue = Number(circleDiameter);

      if (!Number.isFinite(diameterValue) || diameterValue <= 0) {
        return null;
      }

      const radiusMetres = lengthToMetres(diameterValue, lengthUnit) / 2;
      return Math.PI * radiusMetres * radiusMetres;
    }

    const front = Number(frontSide);
    const back = Number(backSide);
    const left = Number(leftSide);
    const right = Number(rightSide);

    if (
      ![front, back, left, right].every(
        (value) => Number.isFinite(value) && value > 0,
      )
    ) {
      return null;
    }

    const frontMetres = lengthToMetres(front, lengthUnit);
    const backMetres = lengthToMetres(back, lengthUnit);
    const leftMetres = lengthToMetres(left, lengthUnit);
    const rightMetres = lengthToMetres(right, lengthUnit);
    const diagonalValue = Number(plotDiagonal);

    if (plotDiagonal.trim()) {
      if (!Number.isFinite(diagonalValue) || diagonalValue <= 0) {
        return null;
      }

      const diagonalMetres = lengthToMetres(diagonalValue, lengthUnit);
      const firstTriangle = triangleAreaFromSides(
        frontMetres,
        rightMetres,
        diagonalMetres,
      );
      const secondTriangle = triangleAreaFromSides(
        backMetres,
        leftMetres,
        diagonalMetres,
      );

      if (firstTriangle === null || secondTriangle === null) {
        return null;
      }

      return firstTriangle + secondTriangle;
    }

    // Without a diagonal or surveyed area, four side lengths do not define a
    // unique quadrilateral. Use the average of opposite sides only as a rough
    // planning estimate.
    const averageLengthMetres = (frontMetres + backMetres) / 2;
    const averageWidthMetres = (leftMetres + rightMetres) / 2;

    return averageLengthMetres * averageWidthMetres;
  }

  function generatePlan() {
    const areaSquareMetres = getAreaSquareMetres();
    const potsValue = Number(containerCount);

    if (areaSquareMetres === null || areaSquareMetres <= 0) {
      setFormError("Enter valid measurements greater than zero, or enter the surveyed total area.");
      return;
    }

    if (
      space === "Pot" &&
      (!Number.isInteger(potsValue) || potsValue <= 0)
    ) {
      setFormError("Enter a valid number of available pots.");
      return;
    }

    if (planningMode === "choose" && selectedPlants.length === 0) {
      setFormError(
        "Select at least one plant, crop, flower or tree before generating the plan.",
      );
      return;
    }

    const candidates =
      planningMode === "choose"
        ? selectedPlants
        : availablePlants.filter(
            (plant) =>
              category === "All" ||
              plant.category === category,
          );

    if (candidates.length === 0) {
      setFormError(
        "No plants are available for the current space and category.",
      );
      return;
    }

    const ranked = candidates
      .map((rule) => ({
        rule,
        score: scorePlant(
          rule,
          space,
          sunlight,
          water,
          soil,
          season,
        ),
      }))
      .sort((first, second) => second.score - first.score);

    const selectedRules =
      planningMode === "suggest"
        ? ranked.slice(0, 10)
        : ranked;

    const recommendations: Recommendation[] = selectedRules.map(
      ({ rule, score }) => {
        const details = getMatchDetails(
          rule,
          space,
          sunlight,
          water,
          soil,
          season,
        );

        return {
          ...rule,
          score,
          estimatedCount: estimateCapacity(
            space,
            areaSquareMetres,
            potsValue,
            rule.spacingCm,
            selectedRules.length,
          ),
          ...details,
        };
      },
    );

    const irrigationAdvice =
      water === "low"
        ? "Prioritise drip watering, mulch and moisture checks. Avoid choosing too many high-water plants."
        : water === "high"
          ? "Provide drainage and avoid leaving roots in standing water, especially after rain."
          : "Use regular morning watering and adjust frequency after checking soil moisture.";

    setFormError("");
    setPlan({
      areaSquareMetres,
      recommendations,
      irrigationAdvice,
      mode: planningMode,
    });
  }

  return (
    <main className="page-wrap">
      <div className="max-w-4xl py-1 sm:py-2">
        <p className="eyebrow">Growing-space modes</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Grow Planner
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
          Choose plants yourself or ask PlantVerse for the best options based on
          your space, dimensions, sunlight, water, soil and season.
        </p>
      </div>

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
            className={
              space === item
                ? "voice-button"
                : "outline-button"
            }
            aria-pressed={space === item}
          >
            <span aria-hidden="true">
              {spaceIcons[item]}
            </span>
            <span className="ml-2">{item}</span>
          </button>
        ))}
      </div>

      <div className="relative mt-8 sm:hidden">
        <p className="mb-2 text-sm font-medium">
          Growing space
        </p>

        <button
          type="button"
          onClick={() =>
            setSpaceMenuOpen((current) => !current)
          }
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
                      ? "bg-[var(--brand-primary)] text-white"
                      : "hover:bg-[var(--surface-secondary)]"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className="text-xl"
                      aria-hidden="true"
                    >
                      {spaceIcons[item]}
                    </span>
                    <span className="font-medium">
                      {item}
                    </span>
                  </span>

                  {selected ? (
                    <Check size={18} aria-hidden="true" />
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <section className="dashboard-panel mt-6">
        <p className="eyebrow">Planning preference</p>
        <h2 className="mt-2 text-2xl font-semibold">
          How should PlantVerse build the plan?
        </h2>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={() => changePlanningMode("choose")}
            className={`rounded-3xl border p-5 text-left transition ${
              planningMode === "choose"
                ? "border-green-600 bg-green-50 ring-2 ring-green-600/10 dark:bg-green-500/10"
                : "border-[var(--border-color)] hover:bg-[var(--surface-secondary)]"
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full ${
                  planningMode === "choose"
                    ? "bg-green-600 text-white"
                    : "bg-[var(--surface-secondary)]"
                }`}
              >
                {planningMode === "choose" ? (
                  <Check size={18} />
                ) : (
                  "1"
                )}
              </span>
              <span className="font-semibold">
                Choose what you want to grow
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
              Search and select one or more plants, crops,
              herbs, flowers or trees.
            </p>
          </button>

          <button
            type="button"
            onClick={() => changePlanningMode("suggest")}
            className={`rounded-3xl border p-5 text-left transition ${
              planningMode === "suggest"
                ? "border-green-600 bg-green-50 ring-2 ring-green-600/10 dark:bg-green-500/10"
                : "border-[var(--border-color)] hover:bg-[var(--surface-secondary)]"
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full ${
                  planningMode === "suggest"
                    ? "bg-green-600 text-white"
                    : "bg-[var(--surface-secondary)]"
                }`}
              >
                {planningMode === "suggest" ? (
                  <Sparkles size={18} />
                ) : (
                  "2"
                )}
              </span>
              <span className="font-semibold">
                Suggest the best options
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
              Rank the plants that best match the selected
              conditions.
            </p>
          </button>
        </div>
      </section>

      <div className="mt-6 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="dashboard-panel">
          {planningMode === "choose" ? (
            <>
              <p className="eyebrow">
                Choose what to grow
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                Search and select plants
              </h2>
            </>
          ) : (
            <>
              <p className="eyebrow">
                Recommendation category
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                What type of options should be suggested?
              </h2>
            </>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setCategory(item);
                  setPlan(null);
                }}
                className={
                  category === item
                    ? "voice-button"
                    : "outline-button"
                }
              >
                {item}
              </button>
            ))}
          </div>

          {planningMode === "choose" ? (
            <>
              <label className="relative mt-5 block">
                <span className="sr-only">Search plants</span>
                <Search
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setGlobalSearchStatus("idle");
                    setGlobalSearchError("");
                  }}
                  placeholder="Search tomato, mango, paddy, rose..."
                  className="min-h-12 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--surface-secondary)] pl-11 pr-4 outline-none focus:border-[var(--brand-primary)]"
                />
              </label>

              {selectedPlants.length ? (
                <div className="mt-4">
                  <p className="text-sm font-semibold">
                    Selected plants
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedPlants.map((plant) => (
                      <button
                        key={plant.id}
                        type="button"
                        onClick={() =>
                          togglePlant(plant.id)
                        }
                        className="flex items-center gap-2 rounded-full border border-green-600/25 bg-green-50 px-3 py-2 text-sm font-medium text-green-800 dark:bg-green-500/10 dark:text-green-200"
                        aria-label={`Remove ${plant.name}`}
                      >
                        <span aria-hidden="true">
                          {plant.icon}
                        </span>
                        {plant.name}
                        <X size={14} aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-5 grid max-h-[430px] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
                {filteredPlants.map((plant) => {
                  const selected =
                    selectedPlantIds.includes(plant.id);

                  return (
                    <button
                      key={plant.id}
                      type="button"
                      onClick={() =>
                        togglePlant(plant.id)
                      }
                      className={`flex items-center justify-between rounded-2xl border p-4 text-left transition ${
                        selected
                          ? "border-green-600 bg-green-50 dark:bg-green-500/10"
                          : "border-[var(--border-color)] hover:bg-[var(--surface-secondary)]"
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span
                          className="text-2xl"
                          aria-hidden="true"
                        >
                          {plant.icon}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-semibold">
                            {plant.name}
                          </span>
                          <span className="block text-xs text-[var(--text-secondary)]">
                            {plant.category}
                            {plant.source === "global" ? " · Global result" : ""}
                          </span>
                          {!plant.spaces.includes(space) ? (
                            <span className="mt-1 block text-xs font-medium text-amber-700 dark:text-amber-300">
                              Suitability warning for {space}
                            </span>
                          ) : null}
                        </span>
                      </span>

                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                          selected
                            ? "border-green-600 bg-green-600 text-white"
                            : "border-[var(--border-color)]"
                        }`}
                      >
                        {selected ? (
                          <Check size={15} />
                        ) : null}
                      </span>
                    </button>
                  );
                })}
              </div>

              {!filteredPlants.length ? (
                <div className="mt-5 rounded-2xl border border-[var(--border-color)] bg-[var(--surface-secondary)] p-5 text-sm text-[var(--text-secondary)]">
                  {globalSearchStatus === "loading" ? (
                    <div className="flex items-center gap-3">
                      <LoaderCircle
                        size={18}
                        className="animate-spin text-[var(--brand-primary)]"
                      />
                      Searching global plant sources for “{searchQuery.trim()}”…
                    </div>
                  ) : globalSearchStatus === "not-found" ? (
                    <div>
                      <p>No verified plant match was found globally.</p>
                      <button
                        type="button"
                        onClick={() => void searchGlobalPlant(searchQuery, true)}
                        className="mt-3 font-semibold text-[var(--brand-primary)]"
                      >
                        Search again
                      </button>
                    </div>
                  ) : globalSearchStatus === "error" ? (
                    <div>
                      <p>{globalSearchError}</p>
                      <button
                        type="button"
                        onClick={() => void searchGlobalPlant(searchQuery, true)}
                        className="mt-3 font-semibold text-[var(--brand-primary)]"
                      >
                        Retry global search
                      </button>
                    </div>
                  ) : searchQuery.trim().length >= 2 ? (
                    <div>
                      <div className="flex items-center gap-3">
                        <Globe2 size={18} className="text-[var(--brand-primary)]" />
                        <span>No local match was found.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => void searchGlobalPlant(searchQuery)}
                        className="mt-3 font-semibold text-[var(--brand-primary)]"
                      >
                        Search global plant sources
                      </button>
                    </div>
                  ) : (
                    "Enter at least two letters to search the plant catalog."
                  )}
                </div>
              ) : null}
            </>
          ) : (
            <div className="mt-5 rounded-3xl bg-[var(--surface-secondary)] p-5">
              <div className="flex items-start gap-3">
                <Sparkles
                  size={22}
                  className="mt-0.5 shrink-0 text-[var(--brand-primary)]"
                />
                <div>
                  <p className="font-semibold">
                    PlantVerse will rank up to 10 options
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                    Suggestions are selected from{" "}
                    {category === "All"
                      ? "all available categories"
                      : category.toLowerCase()}{" "}
                    that can be grown in {space.toLowerCase()}.
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="dashboard-panel">
          <p className="eyebrow">
            Your growing conditions
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            Enter site details
          </h2>

          {space !== "Pot" ? (
            <>
              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMeasurementMode("shape");
                    setPlan(null);
                  }}
                  className={
                    measurementMode === "shape"
                      ? "voice-button"
                      : "outline-button"
                  }
                >
                  Measure the plot shape
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMeasurementMode("area");
                    setPlan(null);
                  }}
                  className={
                    measurementMode === "area"
                      ? "voice-button"
                      : "outline-button"
                  }
                >
                  Enter surveyed total area
                </button>
              </div>

              {measurementMode === "shape" ? (
                <div className="mt-4">
                  <p className="text-sm font-medium">Plot shape</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    {(Object.keys(plotShapeLabels) as PlotShape[]).map(
                      (shape) => (
                        <button
                          key={shape}
                          type="button"
                          onClick={() => {
                            setPlotShape(shape);
                            setPlan(null);
                          }}
                          className={`rounded-2xl border px-3 py-3 text-sm font-medium transition ${
                            plotShape === shape
                              ? "border-green-600 bg-green-600 text-white"
                              : "border-[var(--border-color)] hover:bg-[var(--surface-secondary)]"
                          }`}
                        >
                          {plotShapeLabels[shape]}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              ) : null}
            </>
          ) : null}

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {space === "Pot" ? (
              <>
                <label className="block text-sm font-medium">
                  Number of available pots
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={containerCount}
                    onChange={(event) =>
                      setContainerCount(event.target.value)
                    }
                    className={inputClass}
                  />
                </label>

                <label className="block text-sm font-medium">
                  Average pot diameter
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={potDiameter}
                    onChange={(event) =>
                      setPotDiameter(event.target.value)
                    }
                    className={inputClass}
                  />
                </label>

                <div className="sm:col-span-2">
                  <p className="text-sm font-medium">Pot diameter unit</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {(Object.keys(lengthUnitLabels) as LengthUnit[]).map(
                      (unit) => (
                        <button
                          key={unit}
                          type="button"
                          onClick={() => {
                            setLengthUnit(unit);
                            setPlan(null);
                          }}
                          className={`rounded-2xl border px-3 py-3 text-sm font-medium transition ${
                            lengthUnit === unit
                              ? "border-green-600 bg-green-600 text-white"
                              : "border-[var(--border-color)] hover:bg-[var(--surface-secondary)]"
                          }`}
                        >
                          {lengthUnitLabels[unit]}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              </>
            ) : measurementMode === "area" ? (
              <>
                <label className="block text-sm font-medium sm:col-span-2">
                  Total growing area
                  <input
                    type="number"
                    min="0.0001"
                    step="any"
                    value={totalArea}
                    onChange={(event) => setTotalArea(event.target.value)}
                    className={inputClass}
                  />
                </label>

                <div className="sm:col-span-2">
                  <p className="text-sm font-medium">Area unit</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
                    {(Object.keys(areaUnitLabels) as AreaUnit[]).map((unit) => (
                      <button
                        key={unit}
                        type="button"
                        onClick={() => {
                          setAreaUnit(unit);
                          setPlan(null);
                        }}
                        className={`rounded-2xl border px-3 py-3 text-sm font-medium transition ${
                          areaUnit === unit
                            ? "border-green-600 bg-green-600 text-white"
                            : "border-[var(--border-color)] hover:bg-[var(--surface-secondary)]"
                        }`}
                      >
                        {areaUnitLabels[unit]}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                {plotShape === "rectangle" ? (
                  <>
                    <label className="block text-sm font-medium">
                      Length
                      <input
                        type="number"
                        min="0.1"
                        step="any"
                        value={length}
                        onChange={(event) => setLength(event.target.value)}
                        className={inputClass}
                      />
                    </label>
                    <label className="block text-sm font-medium">
                      Width
                      <input
                        type="number"
                        min="0.1"
                        step="any"
                        value={width}
                        onChange={(event) => setWidth(event.target.value)}
                        className={inputClass}
                      />
                    </label>
                  </>
                ) : null}

                {plotShape === "circle" ? (
                  <label className="block text-sm font-medium sm:col-span-2">
                    Circle diameter
                    <input
                      type="number"
                      min="0.1"
                      step="any"
                      value={circleDiameter}
                      onChange={(event) =>
                        setCircleDiameter(event.target.value)
                      }
                      className={inputClass}
                    />
                  </label>
                ) : null}

                {plotShape === "four-sides" ? (
                  <>
                    <label className="block text-sm font-medium">
                      Front side
                      <input
                        type="number"
                        min="0.1"
                        step="any"
                        value={frontSide}
                        onChange={(event) => setFrontSide(event.target.value)}
                        className={inputClass}
                      />
                    </label>
                    <label className="block text-sm font-medium">
                      Back side
                      <input
                        type="number"
                        min="0.1"
                        step="any"
                        value={backSide}
                        onChange={(event) => setBackSide(event.target.value)}
                        className={inputClass}
                      />
                    </label>
                    <label className="block text-sm font-medium">
                      Left side
                      <input
                        type="number"
                        min="0.1"
                        step="any"
                        value={leftSide}
                        onChange={(event) => setLeftSide(event.target.value)}
                        className={inputClass}
                      />
                    </label>
                    <label className="block text-sm font-medium">
                      Right side
                      <input
                        type="number"
                        min="0.1"
                        step="any"
                        value={rightSide}
                        onChange={(event) => setRightSide(event.target.value)}
                        className={inputClass}
                      />
                    </label>
                    <label className="block text-sm font-medium sm:col-span-2">
                      Diagonal from front-left to back-right (optional)
                      <input
                        type="number"
                        min="0.1"
                        step="any"
                        value={plotDiagonal}
                        onChange={(event) =>
                          setPlotDiagonal(event.target.value)
                        }
                        placeholder="Add a measured diagonal for a more accurate area"
                        className={inputClass}
                      />
                    </label>
                    <div className="sm:col-span-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-800 dark:bg-amber-500/10 dark:text-amber-100">
                      With a valid diagonal, PlantVerse divides the plot into
                      two triangles for a more accurate calculation. Without a
                      diagonal, it uses the average of opposite sides as a
                      rough estimate. Use the surveyed total-area option for
                      the most reliable result.
                    </div>
                  </>
                ) : null}

                <div className="sm:col-span-2">
                  <p className="text-sm font-medium">Side measurement unit</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {(Object.keys(lengthUnitLabels) as LengthUnit[]).map(
                      (unit) => (
                        <button
                          key={unit}
                          type="button"
                          onClick={() => {
                            setLengthUnit(unit);
                            setPlan(null);
                          }}
                          className={`rounded-2xl border px-3 py-3 text-sm font-medium transition ${
                            lengthUnit === unit
                              ? "border-green-600 bg-green-600 text-white"
                              : "border-[var(--border-color)] hover:bg-[var(--surface-secondary)]"
                          }`}
                        >
                          {lengthUnitLabels[unit]}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              </>
            )}


            <CustomSelect<Sunlight>
              label="Daily sunlight"
              value={sunlight}
              options={(
                Object.entries(sunlightLabels) as [Sunlight, string][]
              ).map(([value, label]) => ({ value, label }))}
              onChange={(value) => {
                setSunlight(value);
                setPlan(null);
              }}
            />

            <CustomSelect<Water>
              label="Water availability"
              value={water}
              options={(
                Object.entries(waterLabels) as [Water, string][]
              ).map(([value, label]) => ({ value, label }))}
              onChange={(value) => {
                setWater(value);
                setPlan(null);
              }}
            />

            <CustomSelect<Soil>
              label="Soil type"
              value={soil}
              options={(
                Object.entries(soilLabels) as [Soil, string][]
              ).map(([value, label]) => ({ value, label }))}
              onChange={(value) => {
                setSoil(value);
                setPlan(null);
              }}
            />

            <CustomSelect<Season>
              label="Current season"
              value={season}
              options={(
                Object.entries(seasonLabels) as [Season, string][]
              ).map(([value, label]) => ({ value, label }))}
              onChange={(value) => {
                setSeason(value);
                setPlan(null);
              }}
            />

            <label className="block text-sm font-medium sm:col-span-2">
              Location
              <input
                type="text"
                value={location}
                onChange={(event) =>
                  setLocation(event.target.value)
                }
                placeholder="Example: Hyderabad, Telangana"
                className={inputClass}
              />
            </label>
          </div>

          {formError ? (
            <div
              role="alert"
              className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
            >
              {formError}
            </div>
          ) : null}

          <button
            type="button"
            onClick={generatePlan}
            className="voice-button mt-6 w-full"
          >
            {plan
              ? "Update growing plan"
              : planningMode === "choose"
                ? "Check selected plants"
                : "Suggest the best options"}
          </button>
        </section>
      </div>

      <section className="dashboard-panel mt-6">
        <p className="eyebrow">
          {plan
            ? plan.mode === "choose"
              ? `Suitability for selected plants in ${space}`
              : `Best matches for ${space}`
            : `Available choices for ${space}`}
        </p>

        <h2 className="mt-2 text-2xl font-semibold">
          {plan
            ? plan.mode === "choose"
              ? "Your growing plan"
              : "Suggested growing plan"
            : planningMode === "choose"
              ? "Select plants and enter site details"
              : "Enter site details to receive suggestions"}
        </h2>

        {plan ? (
          <>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-[var(--surface-secondary)] px-3 py-2">
                {plan.areaSquareMetres.toFixed(1)} m²
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

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {plan.recommendations.map((item) => (
                <article
                  key={item.id}
                  className="rounded-3xl border border-[var(--border-color)] bg-[var(--surface-secondary)] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div
                        className="text-3xl"
                        aria-hidden="true"
                      >
                        {item.icon}
                      </div>
                      <h3 className="mt-3 text-lg font-semibold">
                        {item.name}
                      </h3>
                      <p className="mt-1 text-xs text-[var(--text-secondary)]">
                        {item.category}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        item.score >= 8
                          ? "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-200"
                          : item.score >= 5
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200"
                            : "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-200"
                      }`}
                    >
                      {item.score}/10 match
                    </span>
                  </div>

                  <p className="mt-3 text-sm font-medium">
                    Estimated capacity:{" "}
                    {item.estimatedCount} {item.unit}
                  </p>

                  <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                    Recommended spacing: about{" "}
                    {item.spacingCm} cm. {item.note}
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

                  {item.warnings.length ? (
                    <ul className="mt-3 space-y-1 rounded-2xl bg-amber-50 p-3 text-xs leading-5 text-amber-900 dark:bg-amber-500/10 dark:text-amber-100">
                      {item.warnings.map((warning) => (
                        <li key={warning}>
                          • {warning}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </article>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-green-600/20 bg-green-50 p-4 text-sm leading-6 text-green-900 dark:bg-green-500/10 dark:text-green-100">
              <strong>Water plan:</strong>{" "}
              {plan.irrigationAdvice}
            </div>
          </>
        ) : (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {availablePlants
              .filter(
                (plant) =>
                  category === "All" ||
                  plant.category === category,
              )
              .slice(0, 12)
              .map((plant) => (
                <div
                  key={plant.id}
                  className="flex min-h-28 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-green-600/30 bg-[var(--surface-secondary)] p-3 text-center"
                >
                  <span
                    className="text-3xl"
                    aria-hidden="true"
                  >
                    {plant.icon}
                  </span>
                  <span className="mt-2 font-medium">
                    {plant.name}
                  </span>
                  <span className="mt-1 text-xs text-[var(--text-secondary)]">
                    {plant.category}
                  </span>
                </div>
              ))}
          </div>
        )}

        <p className="mt-5 text-sm leading-6 text-[var(--text-secondary)]">
          This planner provides an initial estimate, not a
          professional crop prescription. Confirm the result
          using local weather, soil testing, drainage, crop
          variety guidance and agricultural advice before
          purchasing plants, trees or seeds.
        </p>
      </section>
    </main>
  );
}