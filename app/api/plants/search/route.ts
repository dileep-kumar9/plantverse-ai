import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const spaces = ["Pot", "Terrace", "Field", "Empty land"] as const;
const categories = [
  "Vegetables",
  "Herbs",
  "Fruits",
  "Flowers",
  "Trees",
  "Field crops",
] as const;
const sunlightLevels = ["low", "medium", "high"] as const;
const waterLevels = ["low", "medium", "high"] as const;
const soilTypes = ["potting", "loamy", "sandy", "clayey"] as const;
const seasons = ["summer", "monsoon", "winter", "year-round"] as const;

type Space = (typeof spaces)[number];
type PlantCategory = (typeof categories)[number];
type Sunlight = (typeof sunlightLevels)[number];
type Water = (typeof waterLevels)[number];
type Soil = (typeof soilTypes)[number];
type Season = (typeof seasons)[number];

type PlantSearchResult = {
  name: string;
  aliases: string[];
  icon: string;
  category: PlantCategory;
  spaces: Space[];
  sunlight: Sunlight[];
  water: Water[];
  soil: Soil[];
  seasons: Season[];
  spacingCm: number;
  unit: string;
  note: string;
};

type ModelPlantResult = PlantSearchResult & {
  found: boolean;
  reason: string;
};

const modelSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "found",
    "reason",
    "name",
    "aliases",
    "icon",
    "category",
    "spaces",
    "sunlight",
    "water",
    "soil",
    "seasons",
    "spacingCm",
    "unit",
    "note",
  ],
  properties: {
    found: {
      type: "boolean",
      description: "True only when the search term is a real plant or crop people intentionally grow.",
    },
    reason: {
      type: "string",
      minLength: 1,
      maxLength: 180,
      description: "A short explanation when found is false, otherwise a short verification note.",
    },
    name: { type: "string", minLength: 2, maxLength: 80 },
    aliases: {
      type: "array",
      maxItems: 8,
      items: { type: "string", minLength: 1, maxLength: 80 },
    },
    icon: { type: "string", minLength: 1, maxLength: 8 },
    category: { type: "string", enum: [...categories] },
    spaces: {
      type: "array",
      minItems: 1,
      maxItems: spaces.length,
      items: { type: "string", enum: [...spaces] },
    },
    sunlight: {
      type: "array",
      minItems: 1,
      maxItems: sunlightLevels.length,
      items: { type: "string", enum: [...sunlightLevels] },
    },
    water: {
      type: "array",
      minItems: 1,
      maxItems: waterLevels.length,
      items: { type: "string", enum: [...waterLevels] },
    },
    soil: {
      type: "array",
      minItems: 1,
      maxItems: soilTypes.length,
      items: { type: "string", enum: [...soilTypes] },
    },
    seasons: {
      type: "array",
      minItems: 1,
      maxItems: seasons.length,
      items: { type: "string", enum: [...seasons] },
    },
    spacingCm: { type: "number", minimum: 5, maximum: 3000 },
    unit: { type: "string", minLength: 2, maxLength: 30 },
    note: { type: "string", minLength: 10, maxLength: 280 },
  },
} as const;

function isOneOf<T extends readonly string[]>(
  value: unknown,
  allowed: T,
): value is T[number] {
  return typeof value === "string" && allowed.includes(value as T[number]);
}

function normalizeStringArray<T extends readonly string[]>(
  value: unknown,
  allowed: T,
): T[number][] {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(value.filter((item): item is T[number] => isOneOf(item, allowed))),
  );
}

function slugify(value: string) {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);

  return slug || `global-plant-${Date.now()}`;
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}

function validatePlant(value: unknown): PlantSearchResult | null {
  if (!value || typeof value !== "object") return null;

  const data = value as Record<string, unknown>;
  const name = cleanText(data.name, 80);
  const category = isOneOf(data.category, categories) ? data.category : null;
  const spacesValue = normalizeStringArray(data.spaces, spaces);
  const sunlight = normalizeStringArray(data.sunlight, sunlightLevels);
  const water = normalizeStringArray(data.water, waterLevels);
  const soil = normalizeStringArray(data.soil, soilTypes);
  const seasonValues = normalizeStringArray(data.seasons, seasons);
  const spacing = Number(data.spacingCm);
  const unit = cleanText(data.unit, 30);
  const note = cleanText(data.note, 280);

  if (
    name.length < 2 ||
    !category ||
    spacesValue.length === 0 ||
    sunlight.length === 0 ||
    water.length === 0 ||
    soil.length === 0 ||
    seasonValues.length === 0 ||
    !Number.isFinite(spacing) ||
    spacing < 5 ||
    spacing > 3000 ||
    unit.length < 2 ||
    note.length < 10
  ) {
    return null;
  }

  const aliases = Array.isArray(data.aliases)
    ? data.aliases
        .map((item) => cleanText(item, 80))
        .filter((item) => item.length > 0)
        .slice(0, 8)
    : [];

  return {
    name,
    aliases: Array.from(new Set(aliases)),
    icon: cleanText(data.icon, 8) || "🌱",
    category,
    spaces: spacesValue,
    sunlight,
    water,
    soil,
    seasons: seasonValues,
    spacingCm: Math.round(spacing),
    unit,
    note,
  };
}

function apiStatus(error: unknown) {
  if (!error || typeof error !== "object") return undefined;

  const data = error as {
    status?: unknown;
    code?: unknown;
    message?: unknown;
  };

  const directStatus = Number(data.status ?? data.code);
  if (Number.isFinite(directStatus)) return directStatus;

  const message = typeof data.message === "string" ? data.message : "";
  if (message.includes("RESOURCE_EXHAUSTED") || message.includes('"code":429')) {
    return 429;
  }
  if (message.includes("NOT_FOUND") || message.includes('"code":404')) {
    return 404;
  }

  return undefined;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      query?: unknown;
      space?: unknown;
      category?: unknown;
      location?: unknown;
    };

    const query = cleanText(body.query, 80);
    const requestedSpace = isOneOf(body.space, spaces) ? body.space : undefined;
    const requestedCategory = isOneOf(body.category, categories)
      ? body.category
      : undefined;
    const location = cleanText(body.location, 100);

    if (query.length < 2) {
      return NextResponse.json(
        { error: "Enter at least two letters to search globally." },
        { status: 400 },
      );
    }

    const apiKey =
      process.env.GEMINI_API_KEY ??
      process.env.GOOGLE_GENAI_API_KEY ??
      process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Global plant search is not configured. Add GEMINI_API_KEY to the server environment variables.",
        },
        { status: 503 },
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = process.env.GEMINI_SEARCH_MODEL ?? "gemini-3.6-flash";

    // One model request performs both Google Search grounding and JSON formatting.
    // This uses less quota than the previous two-request flow.
    const response = await ai.models.generateContent({
      model,
      contents: [
        "Use Google Search to verify the plant or crop in the user's search term.",
        `Search term: ${JSON.stringify(query)}`,
        requestedSpace ? `User's selected growing space: ${requestedSpace}` : "",
        requestedCategory ? `Requested category: ${requestedCategory}` : "",
        location ? `User location: ${location}` : "",
        "Return found=false when the term is not a real plant, crop, herb, fruit, flower, or tree that people intentionally grow.",
        "When found=true, provide broad practical growing information only.",
        "Use these exact enum values: spaces Pot, Terrace, Field, Empty land; categories Vegetables, Herbs, Fruits, Flowers, Trees, Field crops; sunlight low, medium, high; water low, medium, high; soil potting, loamy, sandy, clayey; seasons summer, monsoon, winter, year-round.",
        "Do not provide pesticide dosages, medical claims, guaranteed yields, or unsupported precision.",
        "For found=false, still fill every schema field with harmless placeholder values because the schema requires them; the server will discard those fields.",
      ]
        .filter(Boolean)
        .join("\n"),
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseJsonSchema: modelSchema,
        maxOutputTokens: 900,
      },
    });

    const rawJson = response.text?.trim();
    if (!rawJson) {
      throw new Error("The global plant search returned no data.");
    }

    const parsed = JSON.parse(rawJson) as ModelPlantResult;

    if (!parsed.found) {
      return NextResponse.json(
        {
          error:
            cleanText(parsed.reason, 180) ||
            `No verified growable plant was found for “${query}”.`,
        },
        { status: 404 },
      );
    }

    const plant = validatePlant(parsed);
    if (!plant) {
      throw new Error("The global plant result could not be validated.");
    }

    return NextResponse.json({
      plant: {
        id: `global-${slugify(plant.name)}`,
        ...plant,
        source: "global" as const,
      },
    });
  } catch (error) {
    const status = apiStatus(error);
    console.error("Global plant search failed", error);

    if (status === 429) {
      return NextResponse.json(
        {
          error:
            "Global plant search is temporarily unavailable because the AI search quota has been reached. Please try again later.",
          code: "GLOBAL_SEARCH_QUOTA_REACHED",
        },
        { status: 429 },
      );
    }

    if (status === 404) {
      return NextResponse.json(
        {
          error:
            "The configured Gemini model is unavailable. Check GEMINI_SEARCH_MODEL in the server environment variables.",
          code: "GLOBAL_SEARCH_MODEL_UNAVAILABLE",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        error: "Unable to complete global plant search right now.",
        code: "GLOBAL_SEARCH_FAILED",
      },
      { status: 500 },
    );
  }
}