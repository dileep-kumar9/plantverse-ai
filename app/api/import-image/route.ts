import { NextRequest, NextResponse } from "next/server";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 25 * 1024 * 1024;

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  const driveMatch = trimmed.match(/\/file\/d\/([^/]+)/) || trimmed.match(/[?&]id=([^&]+)/);
  if (trimmed.includes("drive.google.com") && driveMatch?.[1]) {
    return `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
  }
  return trimmed;
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "A public image or video URL is required." }, { status: 400 });
    }

    const normalized = normalizeUrl(url);
    const parsed = new URL(normalized);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return NextResponse.json({ error: "Only HTTP and HTTPS URLs are supported." }, { status: 400 });
    }

    const response = await fetch(normalized, {
      redirect: "follow",
      headers: { "user-agent": "PlantVerse/3.1" },
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "The remote file could not be downloaded. Confirm that the link is public." }, { status: 400 });
    }

    const contentType = (response.headers.get("content-type") || "").split(";")[0].trim();
    const isImage = contentType.startsWith("image/");
    const isVideo = contentType.startsWith("video/");
    if (!isImage && !isVideo) {
      return NextResponse.json({ error: "The provided link does not return an image or video file." }, { status: 400 });
    }

    const bytes = await response.arrayBuffer();
    const maximum = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (bytes.byteLength > maximum) {
      return NextResponse.json({ error: `The remote ${isVideo ? "video" : "image"} is too large.` }, { status: 413 });
    }

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "content-type": contentType,
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to import the media file." },
      { status: 500 },
    );
  }
}
