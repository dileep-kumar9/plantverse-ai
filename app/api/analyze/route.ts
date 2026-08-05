import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { consumeDailyQuota, enforceRateLimit } from "@/lib/rate-limit";
import { assertSameOrigin, cleanText } from "@/lib/security";
import { requireUser } from "@/lib/server/require-user";

export const runtime = "nodejs";
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
const ALLOWED_SCAN_TYPES = new Set(["plant", "soil", "land", "fruit", "flower", "tree", "pest"]);
const LIST_FIELDS = [
  "symptoms",
  "possibleCauses",
  "treatment",
  "prevention",
  "evidenceNeeded",
  "soilImprovement",
  "suitablePlants",
  "fertilizerSuggestions",
  "pesticideSuggestions",
] as const;

function normalizeStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") return Object.values(item).map(String);
        return String(item ?? "");
      })
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 20);
  }
  if (typeof value === "string") return value.trim() ? [value.trim()] : [];
  if (value && typeof value === "object") {
    return Object.values(value)
      .flatMap((item) => (Array.isArray(item) ? item : [item]))
      .map((item) => String(item).trim())
      .filter(Boolean)
      .slice(0, 20);
  }
  return [];
}

function normalizeResult(raw: Record<string, unknown>) {
  const result: Record<string, unknown> = {
    ...raw,
    plantName: cleanText(raw.plantName, 120),
    localName: cleanText(raw.localName, 120),
    scientificName: cleanText(raw.scientificName, 160),
    disease: cleanText(raw.disease, 200),
    severity: cleanText(raw.severity, 80),
    disclaimer: cleanText(raw.disclaimer, 800),
    scene: cleanText(raw.scene, 300),
    soilType: cleanText(raw.soilType, 160),
    growingSpace: cleanText(raw.growingSpace, 80),
    wateringAdvice: cleanText(raw.wateringAdvice, 1000),
    moistureNote: cleanText(raw.moistureNote, 500),
    healthScore: Math.max(0, Math.min(100, Number(raw.healthScore) || 0)),
    confidence: Math.max(0, Math.min(100, Number(raw.confidence) || 0)),
    roadOrNonGrowingSurface: raw.roadOrNonGrowingSurface === true,
  };
  for (const field of LIST_FIELDS) result[field] = normalizeStringList(raw[field]);
  return result;
}

export async function GET(request: NextRequest) {
  try {
    await requireUser(request);
    return NextResponse.json({ route: "PlantVerse analysis API", configured: Boolean(process.env.GEMINI_API_KEY) });
  } catch {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    await enforceRateLimit(request, "analyze-image", 20, 60 * 60, user.sub);
    await consumeDailyQuota(user.sub, "image_analysis");
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "AI service is not configured." }, { status: 503 });

    const formData = await request.formData();
    const image = formData.get("image");
    const requestedScanType = cleanText(formData.get("scanType") || "plant", 30);
    const scanType = ALLOWED_SCAN_TYPES.has(requestedScanType) ? requestedScanType : "plant";
    const growingSpace = cleanText(formData.get("growingSpace") || "unknown", 50);
    const notes = cleanText(formData.get("notes"), 1000);

    if (!(image instanceof File) || !ALLOWED_TYPES.has(image.type.toLowerCase())) {
      return NextResponse.json({ error: "Upload a JPEG, PNG, WebP, HEIC, or HEIF image." }, { status: 400 });
    }
    if (image.size < 1_000) return NextResponse.json({ error: "The image file appears to be empty." }, { status: 400 });
    if (image.size > MAX_IMAGE_SIZE) return NextResponse.json({ error: "Image must be under 8 MB." }, { status: 413 });

    const imageBase64 = Buffer.from(await image.arrayBuffer()).toString("base64");
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
You are PlantVerse AI, a cautious plant and agriculture visual assistant.
Analyze the supplied image for the selected category: ${scanType}.
Growing context: ${growingSpace}.
User notes: ${notes || "None provided"}.

Requirements:
- First classify the scene and explicitly identify roads, buildings, walls, floors, or other non-growing surfaces.
- plantName is the common English name; localName is the commonly used Telugu name written only in Telugu script; scientificName is botanical when known.
- If identification is uncertain, say so and leave localName/scientificName empty rather than guessing.
- For plant-health scans, identify visible symptoms, plausible causes, cautious treatment, prevention, and evidence needed.
- For soil scans, estimate only visible type, texture, and drainage clues. State that exact moisture, pH, nutrients, and contamination cannot be measured from a photograph.
- For land scans, recommend layout only after considering sunlight, water, dimensions, and local conditions.
- Fertilizer and pesticide suggestions must be optional, label-compliant, low-risk, and prioritize integrated pest management.
- healthScore and confidence are numbers from 0 to 100. Every list field is an array of strings.
- Include a concise disclaimer that this is AI guidance, not a laboratory test or licensed agronomist diagnosis.
- Return only valid JSON, no markdown.

Schema:
{"plantName":"","localName":"","scientificName":"","healthScore":0,"disease":"","confidence":0,"severity":"","symptoms":[],"possibleCauses":[],"treatment":[],"prevention":[],"evidenceNeeded":[],"disclaimer":"","scene":"","soilType":"","soilImprovement":[],"suitablePlants":[],"growingSpace":"","roadOrNonGrowingSurface":false,"fertilizerSuggestions":[],"pesticideSuggestions":[],"wateringAdvice":"","moistureNote":""}`;

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: image.type, data: imageBase64 } },
            { text: prompt },
          ],
        },
      ],
      config: { responseMimeType: "application/json", temperature: 0.15 },
    });
    if (!response.text) throw new Error("AI returned an empty response.");
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(response.text) as Record<string, unknown>;
    } catch {
      throw new Error("AI returned an invalid response.");
    }
    return NextResponse.json({ result: normalizeResult(parsed) });
  } catch (error) {
    console.error("PlantVerse analysis failed", error);
    const status = Number((error as { status?: number }).status ?? 500);
    return NextResponse.json(
      { error: status >= 500 ? "Analysis is temporarily unavailable." : error instanceof Error ? error.message : "Analysis failed." },
      { status },
    );
  }
}
