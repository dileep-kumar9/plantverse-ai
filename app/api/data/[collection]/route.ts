import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { canWriteCollection, isUserCollection, safeDocumentId } from "@/lib/data-collections";
import { setDocument, listDocuments } from "@/lib/firebase-admin-rest";
import { enforceRateLimit } from "@/lib/rate-limit";
import { assertSameOrigin, cleanText, validateJsonSize } from "@/lib/security";
import { requireUser } from "@/lib/server/require-user";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ collection: string }> };

function sortRecords<T extends Record<string, unknown>>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aDate = String(a.updatedAt ?? a.createdAt ?? "");
    const bDate = String(b.updatedAt ?? b.createdAt ?? "");
    return bDate.localeCompare(aDate);
  });
}

function normalizedReminder(body: Record<string, unknown>) {
  const title = cleanText(body.title, 180);
  const dueAt = new Date(String(body.dueAt ?? ""));
  if (title.length < 2) throw Object.assign(new Error("Enter a reminder title."), { status: 400 });
  if (Number.isNaN(dueAt.valueOf())) throw Object.assign(new Error("Enter a valid reminder time."), { status: 400 });
  return {
    title,
    dueAt: dueAt.toISOString(),
    done: body.done === true,
    plant: cleanText(body.plant, 120),
    pushEnabled: body.pushEnabled !== false,
    pushSentAt: null,
  };
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireUser(request);
    const { collection } = await context.params;
    if (!isUserCollection(collection)) {
      return NextResponse.json({ error: "Unknown data collection." }, { status: 404 });
    }
    await enforceRateLimit(request, `data-read-${collection}`, 180, 60, user.sub);
    const items = await listDocuments(`users/${user.sub}/${collection}`, 200);
    return NextResponse.json({ items: sortRecords(items) });
  } catch (error) {
    const status = Number((error as { status?: number }).status ?? 500);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load records." },
      { status },
    );
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    const { collection } = await context.params;
    if (!isUserCollection(collection)) {
      return NextResponse.json({ error: "Unknown data collection." }, { status: 404 });
    }
    if (!canWriteCollection(collection, "create")) {
      return NextResponse.json(
        { error: "This collection cannot be created from the browser." },
        { status: 403 },
      );
    }
    await enforceRateLimit(request, `data-write-${collection}`, 60, 60, user.sub);
    const body = (await request.json()) as Record<string, unknown>;
    validateJsonSize(body);
    const id = body.id ? safeDocumentId(String(body.id)) : randomUUID();
    const now = new Date().toISOString();
    const sanitized =
      collection === "reminders" ? normalizedReminder(body) : { ...body, id: undefined };
    const item = await setDocument(`users/${user.sub}/${collection}/${id}`, {
      ...sanitized,
      ownerId: user.sub,
      createdAt: typeof body.createdAt === "string" ? body.createdAt : now,
      updatedAt: now,
    });

    if (collection === "reminders") {
      await setDocument(`scheduledReminders/${user.sub}_${id}`, {
        ...(sanitized as Record<string, unknown>),
        userId: user.sub,
        reminderId: id,
        createdAt: now,
        updatedAt: now,
      });
    }
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    const status = Number((error as { status?: number }).status ?? 400);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create record." },
      { status },
    );
  }
}
