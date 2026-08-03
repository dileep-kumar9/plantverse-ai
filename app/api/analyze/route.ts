import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;

const responseSchema = {
  type: "object",
  properties: {
    plantName: { type: "string" },
    scientificName: { type: "string" },
    healthScore: { type: "number" },
    disease: { type: "string" },
    confidence: { type: "number" },
    severity: {
      type: "string",
      enum: ["none", "mild", "moderate", "severe", "unknown"],
    },
    symptoms: {
      type: "array",
      items: { type: "string" },
    },
    possibleCauses: {
      type: "array",
      items: { type: "string" },
    },
    treatment: {
      type: "array",
      items: { type: "string" },
    },
    prevention: {
      type: "array",
      items: { type: "string" },
    },
    evidenceNeeded: {
      type: "array",
      items: { type: "string" },
    },
    disclaimer: { type: "string" },
  },
  required: [
    "plantName",
    "scientificName",
    "healthScore",
    "disease",
    "confidence",
    "severity",
    "symptoms",
    "possibleCauses",
    "treatment",
    "prevention",
    "evidenceNeeded",
    "disclaimer",
  ],
};

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is not configured." },
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
You are PlantVerse AI, a cautious plant and agriculture visual assistant.

Analyze this image for the selected scan type: ${scanType}.

Requirements:
- Do not invent certainty.
- If the image is unclear, unrelated, or insufficient, explain what additional evidence is needed.
- Keep healthScore and confidence between 0 and 100.
- Avoid presenting pesticide or treatment advice as guaranteed.
- Include practical, low-risk next steps.
- Include a disclaimer recommending local agricultural or horticultural expert confirmation for serious cases.
`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: responseSchema,
        temperature: 0.2,
      },
    });

    if (!response.text) {
      return NextResponse.json(
        { error: "Gemini returned an empty response." },
        { status: 502 },
      );
    }

    const result = JSON.parse(response.text);

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Plant analysis failed:", error);

    return NextResponse.json(
      { error: "Plant analysis failed. Please try another image." },
      { status: 500 },
    );
  }
}
