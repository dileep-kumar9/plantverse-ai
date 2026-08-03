import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;

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
        {
          error:
            "GEMINI_API_KEY is missing in Vercel Environment Variables.",
        },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const image = formData.get("image");
    const scanType = String(formData.get("scanType") ?? "plant");

    if (!(image instanceof File)) {
      return NextResponse.json(
        { error: "An image file is required." },
        { status: 400 },
      );
    }

    if (!image.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are supported." },
        { status: 400 },
      );
    }

    if (image.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "The image must be smaller than 8 MB." },
        { status: 413 },
      );
    }

    const bytes = await image.arrayBuffer();
    const imageBase64 = Buffer.from(bytes).toString("base64");

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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
              text: `
Analyze this image for this PlantVerse scan category: ${scanType}.

Return only valid JSON using this structure:

{
  "plantName": "",
  "scientificName": "",
  "healthScore": 0,
  "disease": "",
  "confidence": 0,
  "severity": "none",
  "symptoms": [],
  "possibleCauses": [],
  "treatment": [],
  "prevention": [],
  "evidenceNeeded": [],
  "disclaimer": ""
}

Rules:
- Scores must be between 0 and 100.
- Do not invent certainty.
- If the image is unclear or unrelated, explain that in evidenceNeeded.
- Give cautious, low-risk recommendations.
`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const responseText = response.text;

    if (!responseText) {
      return NextResponse.json(
        { error: "Gemini returned an empty response." },
        { status: 502 },
      );
    }

    let result: unknown;

    try {
      result = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        {
          error: "Gemini returned invalid JSON.",
          rawResponse: responseText,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Gemini analysis error:", error);

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    return NextResponse.json(
      {
        error: `Gemini request failed: ${message}`,
      },
      { status: 500 },
    );
  }
}
