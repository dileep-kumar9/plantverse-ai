import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { assertSameOrigin, cleanText, validateJsonSize } from "@/lib/security";
import { requireUser } from "@/lib/server/require-user";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    await enforceRateLimit(request, "assistant", 30, 60 * 60, user.sub);
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "AI service is not configured." }, { status: 503 });
    const body = (await request.json()) as Record<string, unknown>;
    validateJsonSize(body, 60_000);
    const message = cleanText(body.message, 2_000);
    const language = cleanText(body.language || "English", 30);
    const level = cleanText(body.level || "beginner", 20);
    if (!message) return NextResponse.json({ error: "Message is required." }, { status: 400 });
    const context = body.context && typeof body.context === "object" ? body.context : {};
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are PlantVerse AI, a cautious agriculture and gardening assistant. Reply in ${language}. Explanation level: ${level}. Use the supplied scan and plant context only when relevant. Clearly distinguish visual inference from measured facts. Never diagnose human or animal illness. For pesticides or fertilizers, prioritize integrated pest management, label compliance, protective equipment, local rules, and professional confirmation. Do not provide instructions for making prohibited or highly hazardous chemicals.\n\nContext:\n${JSON.stringify(context)}\n\nUser: ${message}`,
            },
          ],
        },
      ],
      config: { temperature: 0.3 },
    });
    return NextResponse.json({ reply: response.text || "I could not generate a response." });
  } catch (error) {
    console.error("Assistant request failed", error);
    const status = Number((error as { status?: number }).status ?? 500);
    return NextResponse.json({ error: status >= 500 ? "Assistant request failed." : error instanceof Error ? error.message : "Assistant request failed." }, { status });
  }
}
