import { NextRequest, NextResponse } from "next/server";

import { canWriteCollection, isUserCollection, safeDocumentId } from "@/lib/data-collections";
import { deleteDocument, getDocument, mergeDocument } from "@/lib/firebase-admin-rest";
import { enforceRateLimit } from "@/lib/rate-limit";
import { assertSameOrigin, cleanText, validateJsonSize } from "@/lib/security";
import { requireUser } from "@/lib/server/require-user";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ collection: string; id: string }> };

async function resolvePath(request: NextRequest, context: RouteContext) {
  const user = await requireUser(request);
  const { collection, id } = await context.params;
  if (!isUserCollection(collection)) {
    throw Object.assign(new Error("Unknown data collection."), { status: 404 });
  }
  const safeId = safeDocumentId(id);
  return { user, collection, safeId, path: `users/${user.sub}/${collection}/${safeId}` };
}

function reminderPatch(patch: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  if (patch.title !== undefined) {
    const title = cleanText(patch.title, 180);
    if (title.length < 2) throw Object.assign(new Error("Enter a reminder title."), { status: 400 });
    sanitized.title = title;
  }
  if (patch.dueAt !== undefined) {
    const dueAt = new Date(String(patch.dueAt));
    if (Number.isNaN(dueAt.valueOf())) throw Object.assign(new Error("Enter a valid reminder time."), { status: 400 });
    sanitized.dueAt = dueAt.toISOString();
    sanitized.pushSentAt = null;
  }
  if (patch.done !== undefined) sanitized.done = patch.done === true;
  if (patch.plant !== undefined) sanitized.plant = cleanText(patch.plant, 120);
  if (patch.pushEnabled !== undefined) sanitized.pushEnabled = patch.pushEnabled !== false;
  return sanitized;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { user, collection, path } = await resolvePath(request, context);
    await enforceRateLimit(request, `data-read-${collection}`, 180, 60, user.sub);
    const item = await getDocument(path);
    if (!item) return NextResponse.json({ error: "Record not found." }, { status: 404 });
    return NextResponse.json({ item });
  } catch (error) {
    const status = Number((error as { status?: number }).status ?? 500);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load record." },
      { status },
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const { user, collection, safeId, path } = await resolvePath(request, context);
    if (!canWriteCollection(collection, "update")) {
      return NextResponse.json(
        { error: "This record cannot be changed from the browser." },
        { status: 403 },
      );
    }
    await enforceRateLimit(request, `data-write-${collection}`, 60, 60, user.sub);
    const rawPatch = (await request.json()) as Record<string, unknown>;
    validateJsonSize(rawPatch);
    delete rawPatch.id;
    delete rawPatch.ownerId;
    delete rawPatch.createdAt;
    const patch = collection === "reminders" ? reminderPatch(rawPatch) : rawPatch;
    if (collection === "notifications") {
      const allowed = { read: rawPatch.read === true };
      Object.keys(patch).forEach((key) => delete patch[key]);
      Object.assign(patch, allowed);
    }
    const updatedAt = new Date().toISOString();
    const item = await mergeDocument(path, { ...patch, updatedAt });
    if (collection === "reminders") {
      await mergeDocument(`scheduledReminders/${user.sub}_${safeId}`, {
        ...patch,
        userId: user.sub,
        reminderId: safeId,
        updatedAt,
      });
    }
    return NextResponse.json({ item });
  } catch (error) {
    const status = Number((error as { status?: number }).status ?? 400);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update record." },
      { status },
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const { user, collection, safeId, path } = await resolvePath(request, context);
    if (!canWriteCollection(collection, "delete")) {
      return NextResponse.json(
        { error: "This record cannot be deleted from the browser." },
        { status: 403 },
      );
    }
    await enforceRateLimit(request, `data-delete-${collection}`, 30, 60, user.sub);
    await deleteDocument(path);
    if (collection === "reminders") {
      await deleteDocument(`scheduledReminders/${user.sub}_${safeId}`).catch(() => undefined);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    const status = Number((error as { status?: number }).status ?? 400);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete record." },
      { status },
    );
  }
}
