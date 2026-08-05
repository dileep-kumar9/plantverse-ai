import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getDocument, listDocuments, setDocument } from "@/lib/firebase-admin-rest";
import { enforceRateLimit } from "@/lib/rate-limit";
import { assertSameOrigin, cleanText, validateJsonSize } from "@/lib/security";
import { requireUser } from "@/lib/server/require-user";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    await enforceRateLimit(request, "community-read", 120, 60, user.sub);
    const posts = await listDocuments<Record<string, unknown>>("communityPosts", 100);
    const includeHidden = request.nextUrl.searchParams.get("moderation") === "all" && user.role === "admin";
    const visible = posts
      .filter((post) => includeHidden || post.status !== "hidden")
      .sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));
    return NextResponse.json({ items: visible });
  } catch (error) {
    const status = Number((error as { status?: number }).status ?? 500);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load posts." }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    await enforceRateLimit(request, "community-post", 5, 3600, user.sub);
    const body = (await request.json()) as Record<string, unknown>;
    validateJsonSize(body, 20_000);
    const title = cleanText(body.title, 120);
    const content = cleanText(body.body, 3000);
    const tag = cleanText(body.tag || "General", 40);
    if (title.length < 5 || content.length < 10) {
      return NextResponse.json({ error: "Add a clearer title and description." }, { status: 400 });
    }
    const expert = await getDocument<Record<string, unknown>>(`experts/${user.sub}`);
    const verifiedExpert = expert?.status === "verified";
    const id = randomUUID();
    const item = await setDocument(`communityPosts/${id}`, {
      title,
      body: content,
      tag,
      authorId: user.sub,
      authorName: user.name || user.email.split("@")[0],
      verifiedExpert,
      expertSpecialization: verifiedExpert ? String(expert?.specialization ?? "") : "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      replies: 0,
      reports: 0,
      status: "published",
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    const status = Number((error as { status?: number }).status ?? 400);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to publish post." }, { status });
  }
}
