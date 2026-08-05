import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { consumeDailyQuota, enforceRateLimit } from "@/lib/rate-limit";
import { assertSameOrigin, cleanText } from "@/lib/security";
import { requireUser } from "@/lib/server/require-user";

export const runtime = "nodejs";
const MAX_VIDEO_SIZE = 18 * 1024 * 1024;

function normalizeList(value: unknown): string[] {
  return (Array.isArray(value) ? value : value ? [value] : [])
    .map((item) => cleanText(item, 500))
    .filter(Boolean)
    .slice(0, 15);
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    await enforceRateLimit(request, "analyze-video", 8, 60 * 60, user.sub);
    await consumeDailyQuota(user.sub, "video_analysis");
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "AI service is not configured." }, { status: 503 });
    const formData = await request.formData();
    const video = formData.get("video");
    const narration = cleanText(formData.get("narration"), 1000);
    const scanType = cleanText(formData.get("scanType") || "plant", 30);
    if (!(video instanceof File) || !video.type.startsWith("video/")) {
      return NextResponse.json({ error: "A valid video is required." }, { status: 400 });
    }
    if (video.size < 2_000) return NextResponse.json({ error: "The video appears to be empty." }, { status: 400 });
    if (video.size > MAX_VIDEO_SIZE) return NextResponse.json({ error: "Video must be under 18 MB." }, { status: 413 });

    const data = Buffer.from(await video.arrayBuffer()).toString("base64");
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: video.type, data } },
            {
              text: `Analyze this ${scanType} video together with the user's explanation: ${narration || "None"}. Identify the location/scene, subject, visible concerns, uncertainty, evidence needed, and low-risk next steps. If this is a road or non-growing surface, state that clearly. Do not infer exact moisture, pH, nutrients, or chemical contamination from video. Return only concise valid JSON with keys summary, scene, observations, recommendations, evidenceNeeded, confidence, disclaimer. observations, recommendations, and evidenceNeeded must be arrays of strings.`,
            },
          ],
        },
      ],
      config: { responseMimeType: "application/json", temperature: 0.15 },
    });
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(response.text || "{}") as Record<string, unknown>;
    } catch {
      throw new Error("AI returned an invalid response.");
    }
    return NextResponse.json({
      result: {
        summary: cleanText(parsed.summary, 1200),
        scene: cleanText(parsed.scene, 500),
        observations: normalizeList(parsed.observations),
        recommendations: normalizeList(parsed.recommendations),
        evidenceNeeded: normalizeList(parsed.evidenceNeeded),
        confidence: Math.max(0, Math.min(100, Number(parsed.confidence) || 0)),
        disclaimer: cleanText(parsed.disclaimer, 800),
      },
    });
  } catch (error) {
    console.error("Video analysis failed", error);
    const status = Number((error as { status?: number }).status ?? 500);
    return NextResponse.json(
      { error: status >= 500 ? "Video analysis is temporarily unavailable." : error instanceof Error ? error.message : "Video analysis failed." },
      { status },
    );
  }
}
