import { NextRequest, NextResponse } from "next/server";
import { consumeDailyQuota, enforceRateLimit } from "@/lib/rate-limit";
import { assertSameOrigin, cleanText } from "@/lib/security";
import { requireUser } from "@/lib/server/require-user";
import { fetchPublicMedia } from "@/lib/safe-url";

export const runtime = "nodejs";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 25 * 1024 * 1024;

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  const driveMatch = trimmed.match(/\/file\/d\/([^/]+)/) || trimmed.match(/[?&]id=([^&]+)/);
  if (trimmed.includes("drive.google.com") && driveMatch?.[1]) {
    return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(driveMatch[1])}`;
  }
  return trimmed;
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    await enforceRateLimit(request, "remote-media", 20, 60 * 60, user.sub);
    await consumeDailyQuota(user.sub, "remote_import");
    const body = (await request.json()) as { url?: string };
    const rawUrl = cleanText(body.url, 2_000);
    if (!rawUrl) return NextResponse.json({ error: "A public image or video URL is required." }, { status: 400 });

    const response = await fetchPublicMedia(normalizeUrl(rawUrl));
    if (!response.ok) {
      return NextResponse.json({ error: "The remote file could not be downloaded. Confirm the link is public." }, { status: 400 });
    }
    const contentType = (response.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    const isImage = contentType.startsWith("image/");
    const isVideo = contentType.startsWith("video/");
    if (!isImage && !isVideo) {
      return NextResponse.json({ error: "The link does not return an image or video file." }, { status: 400 });
    }
    const maximum = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    const declaredSize = Number(response.headers.get("content-length") ?? 0);
    if (declaredSize > maximum) return NextResponse.json({ error: "The remote media file is too large." }, { status: 413 });
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > maximum) return NextResponse.json({ error: "The remote media file is too large." }, { status: 413 });

    return new NextResponse(bytes, {
      headers: {
        "content-type": contentType,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    const status = Number((error as { status?: number }).status ?? 400);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to import media." }, { status });
  }
}
