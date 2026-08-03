import { NextRequest, NextResponse } from "next/server";

const MAX_BYTES = 8 * 1024 * 1024;

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
      return NextResponse.json({ error: "A public image URL is required." }, { status: 400 });
    }

    const normalized = normalizeUrl(url);
    const parsed = new URL(normalized);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return NextResponse.json({ error: "Only HTTP and HTTPS URLs are supported." }, { status: 400 });
    }

    const response = await fetch(normalized, {
      redirect: "follow",
      headers: { "user-agent": "PlantVerse/1.0" },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "The remote image could not be downloaded." }, { status: 400 });
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "The provided link does not return an image." }, { status: 400 });
    }

    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: "The remote image must be smaller than 8 MB." }, { status: 413 });
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
      { error: error instanceof Error ? error.message : "Unable to import the image." },
      { status: 500 },
    );
  }
}
