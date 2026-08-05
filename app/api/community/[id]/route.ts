import { NextRequest, NextResponse } from "next/server";
import { deleteDocument, getDocument, mergeDocument } from "@/lib/firebase-admin-rest";
import { enforceRateLimit } from "@/lib/rate-limit";
import { assertSameOrigin } from "@/lib/security";
import { requireUser } from "@/lib/server/require-user";
import { safeDocumentId } from "@/lib/data-collections";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    await enforceRateLimit(request, "community-report", 10, 3600, user.sub);
    const { id } = await context.params;
    const safeId = safeDocumentId(id);
    const path = `communityPosts/${safeId}`;
    const post = await getDocument<Record<string, unknown>>(path);
    if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });
    const body = (await request.json()) as { action?: string };
    if (body.action === "report") {
      const reports = Number(post.reports ?? 0) + 1;
      const item = await mergeDocument(path, {
        reports,
        status: reports >= 3 ? "hidden" : post.status,
        updatedAt: new Date().toISOString(),
      });
      return NextResponse.json({ item });
    }
    if (body.action === "hide" && user.role === "admin") {
      const item = await mergeDocument(path, { status: "hidden", updatedAt: new Date().toISOString() });
      return NextResponse.json({ item });
    }
    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch (error) {
    const status = Number((error as { status?: number }).status ?? 400);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update post." }, { status });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    const { id } = await context.params;
    const safeId = safeDocumentId(id);
    const path = `communityPosts/${safeId}`;
    const post = await getDocument<Record<string, unknown>>(path);
    if (!post) return NextResponse.json({ ok: true });
    if (post.authorId !== user.sub && user.role !== "admin") {
      return NextResponse.json({ error: "You cannot delete this post." }, { status: 403 });
    }
    await deleteDocument(path);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = Number((error as { status?: number }).status ?? 400);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to delete post." }, { status });
  }
}
