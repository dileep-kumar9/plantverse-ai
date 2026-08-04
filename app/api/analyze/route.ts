import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const MAX_IMAGE_SIZE = 8 * 1024 * 1024;

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
        if (typeof item === "string") {
          return item;
        }

        if (item && typeof item === "object") {
          return Object.values(item).map(String);
        }

        return String(item ?? "");
      })
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }

  if (value && typeof value === "object") {
    return Object.values(value)
      .flatMap((item) => (Array.isArray(item) ? item : [item]))
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeResult(rawResult: Record<string, unknown>) {
  const result: Record<string, unknown> = {
    ...rawResult,
    plantName:
      typeof rawResult.plantName === "string"
        ? rawResult.plantName.trim()
        : "",
    localName:
      typeof rawResult.localName === "string"
        ? rawResult.localName.trim()
        : "",
    scientificName:
      typeof rawResult.scientificName === "string"
        ? rawResult.scientificName.trim()
        : "",
    healthScore: Math.max(
      0,
      Math.min(100, Number(rawResult.healthScore) || 0),
    ),
    confidence: Math.max(
      0,
      Math.min(100, Number(rawResult.confidence) || 0),
    ),
    roadOrNonGrowingSurface:
      rawResult.roadOrNonGrowingSurface === true,
  };

  for (const field of LIST_FIELDS) {
    result[field] = normalizeStringList(rawResult[field]);
  }

  return result;
}

export async function GET() {
  return NextResponse.json({
    route: "PlantVerse analysis API",
    configured: Boolean(process.env.GEMINI_API_KEY),
  });
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is missing." },
        { status: 500 },
      );
    }

    const formData = await request.formData();

    const image = formData.get("image");
    const scanType = String(formData.get("scanType") || "plant");
    const growingSpace = String(
      formData.get("growingSpace") || "unknown",
    );
    const notes = String(formData.get("notes") || "");

    if (!(image instanceof File) || !image.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "A valid image is required." },
        { status: 400 },
      );
    }

    if (image.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: "Image must be under 8 MB." },
        { status: 413 },
      );
    }

    const imageBase64 = Buffer.from(
      await image.arrayBuffer(),
    ).toString("base64");

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
You are PlantVerse AI, a cautious plant and agriculture visual assistant.

Analyze this image for the selected scan category: ${scanType}.
User-selected growing space: ${growingSpace}.
User notes: ${notes || "None provided"}.

Language requirements:
- plantName must contain the common English name.
- localName must contain the commonly used Telugu name written only in Telugu script.
- Example: Tomato → టమాటా, Rose → గులాబీ, Mango → మామిడి.
- If the subject cannot be identified confidently, return an empty localName.
- scientificName should contain the scientific botanical name when known.

Analysis requirements:
- First classify the scene.
- Explicitly identify roads, buildings, walls, floors, or other non-growing surfaces.
- For plant-health scans, identify the likely plant, health condition, symptoms, causes and cautious treatment.
- For soil scans, estimate only visible soil type, texture and drainage clues.
- State that exact soil moisture cannot be measured from a photograph.
- For land scans, recommend suitable plants and layout based on pot, terrace, field or empty land.
- For fruit, flower, tree and pest scans, specialize the report for that category.
- Fertilizer and pesticide advice must be optional, cautious and label-compliant.
- Prefer integrated pest management and low-risk recommendations.
- healthScore and confidence must be numbers between 0 and 100.
- Every list field must always be returned as a JSON array of strings.
- Do not return markdown or code fences.

Return ONLY valid JSON with these keys:

{
  "plantName": "",
  "localName": "",
  "scientificName": "",
  "healthScore": 0,
  "disease": "",
  "confidence": 0,
  "severity": "",
  "symptoms": [],
  "possibleCauses": [],
  "treatment": [],
  "prevention": [],
  "evidenceNeeded": [],
  "disclaimer": "",
  "scene": "",
  "soilType": "",
  "soilImprovement": [],
  "suitablePlants": [],
  "growingSpace": "",
  "roadOrNonGrowingSurface": false,
  "fertilizerSuggestions": [],
  "pesticideSuggestions": [],
  "wateringAdvice": "",
  "moistureNote": ""
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: image.type,
                data: imageBase64,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    if (!response.text) {
      return NextResponse.json(
        { error: "Gemini returned an empty response." },
        { status: 502 },
      );
    }

    let parsedResult: Record<string, unknown>;

    try {
      parsedResult = JSON.parse(response.text);
    } catch {
      return NextResponse.json(
        {
          error: "Gemini returned an invalid JSON response.",
          rawResponse: response.text,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      result: normalizeResult(parsedResult),
    });
  } catch (error) {
    console.error("PlantVerse analysis failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Analysis failed.",
      },
      { status: 500 },
    );
  }
}