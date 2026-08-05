import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { consumeDailyQuota, enforceRateLimit } from "@/lib/rate-limit";
import { assertSameOrigin, cleanText } from "@/lib/security";
import { requireUser } from "@/lib/server/require-user";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    await enforceRateLimit(request, "translate", 40, 60 * 60, user.sub);
    await consumeDailyQuota(user.sub, "translation");
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "AI service is not configured." }, { status: 503 });
    const body = (await request.json()) as Record<string, unknown>;
    const text = cleanText(body.text, 10_000);
    const targetLanguage = cleanText(body.targetLanguage || "Telugu", 30);
    const context = cleanText(body.context || "agriculture", 30);
    const mode = cleanText(body.mode || "line-by-line", 30);
    if (!text) return NextResponse.json({ error: "Text is required." }, { status: 400 });
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Translate the following ${context} text into ${targetLanguage}. Preserve plant names accurately, keep scientific names unchanged, preserve numbering and safety warnings. Output ${mode}. Return only the translation.\n\n${text}`,
            },
          ],
        },
      ],
      config: { temperature: 0.1 },
    });
    return NextResponse.json({ translation: response.text || "" });
  } catch (error) {
    console.error("Translation failed", error);
    const status = Number((error as { status?: number }).status ?? 500);
    return NextResponse.json({ error: status >= 500 ? "Translation failed." : error instanceof Error ? error.message : "Translation failed." }, { status });
  }
}
