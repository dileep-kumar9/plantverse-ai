import { randomUUID } from "node:crypto";
import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  canWriteCollection,
  isUserCollection,
  safeDocumentId,
} from "@/lib/data-collections";
import {
  createDocument,
  listDocuments,
  setDocument,
} from "@/lib/firebase-admin-rest";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  assertSameOrigin,
  cleanText,
  validateJsonSize,
} from "@/lib/security";
import { requireUser } from "@/lib/server/require-user";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ collection: string }>;
};

function sortRecords<T extends Record<string, unknown>>(
  items: T[],
): T[] {
  return [...items].sort((first, second) => {
    const firstDate = String(
      first.updatedAt ?? first.createdAt ?? "",
    );
    const secondDate = String(
      second.updatedAt ?? second.createdAt ?? "",
    );

    return secondDate.localeCompare(firstDate);
  });
}

function normalizedReminder(
  body: Record<string, unknown>,
) {
  const title = cleanText(body.title, 180);
  const dueAt = new Date(String(body.dueAt ?? ""));

  if (title.length < 2) {
    throw Object.assign(
      new Error("Enter a reminder title."),
      { status: 400 },
    );
  }

  if (Number.isNaN(dueAt.valueOf())) {
    throw Object.assign(
      new Error("Enter a valid reminder time."),
      { status: 400 },
    );
  }

  return {
    title,
    dueAt: dueAt.toISOString(),
    done: body.done === true,
    plant: cleanText(body.plant, 120),
    pushEnabled: body.pushEnabled !== false,
    pushSentAt: null,
  };
}

function normalizedPlant(
  body: Record<string, unknown>,
) {
  const name = cleanText(body.name, 120);
  const place = cleanText(body.place, 120);
  const health = Number(body.health);

  if (name.length < 2) {
    throw Object.assign(
      new Error(
        "Enter a plant name with at least 2 characters.",
      ),
      { status: 400 },
    );
  }

  if (place.length < 2) {
    throw Object.assign(
      new Error("Enter where the plant is growing."),
      { status: 400 },
    );
  }

  if (!Number.isFinite(health)) {
    throw Object.assign(
      new Error("Enter a valid plant health score."),
      { status: 400 },
    );
  }

  return {
    name,
    localName: cleanText(body.localName, 120),
    scientificName: cleanText(
      body.scientificName,
      160,
    ),
    place,
    health: Math.max(0, Math.min(100, health)),
    icon: cleanText(body.icon, 16) || "🪴",
    notes: cleanText(body.notes, 1500),
  };
}

function sanitizedCreateBody(
  collection: string,
  body: Record<string, unknown>,
) {
  if (collection === "reminders") {
    return normalizedReminder(body);
  }

  if (collection === "plants") {
    return normalizedPlant(body);
  }

  const sanitized = { ...body };

  delete sanitized.id;
  delete sanitized.ownerId;
  delete sanitized.createdAt;
  delete sanitized.updatedAt;

  return sanitized;
}

export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const user = await requireUser(request);
    const { collection } = await context.params;

    if (!isUserCollection(collection)) {
      return NextResponse.json(
        { error: "Unknown data collection." },
        { status: 404 },
      );
    }

    await enforceRateLimit(
      request,
      `data-read-${collection}`,
      180,
      60,
      user.sub,
    );

    const items = await listDocuments(
      `users/${user.sub}/${collection}`,
      200,
    );

    return NextResponse.json({
      items: sortRecords(items),
    });
  } catch (error) {
    const status = Number(
      (error as { status?: number }).status ?? 500,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load records.",
      },
      { status },
    );
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    assertSameOrigin(request);

    const user = await requireUser(request);
    const { collection } = await context.params;

    if (!isUserCollection(collection)) {
      return NextResponse.json(
        { error: "Unknown data collection." },
        { status: 404 },
      );
    }

    if (!canWriteCollection(collection, "create")) {
      return NextResponse.json(
        {
          error:
            "This collection cannot be created from the browser.",
        },
        { status: 403 },
      );
    }

    await enforceRateLimit(
      request,
      `data-write-${collection}`,
      60,
      60,
      user.sub,
    );

    const body =
      (await request.json()) as Record<string, unknown>;

    validateJsonSize(body);

    const id = body.id
      ? safeDocumentId(String(body.id))
      : randomUUID();

    const now = new Date().toISOString();
    const sanitized = sanitizedCreateBody(
      collection,
      body,
    );

    const item = await createDocument(
      `users/${user.sub}/${collection}/${id}`,
      {
        ...sanitized,
        ownerId: user.sub,
        createdAt: now,
        updatedAt: now,
      },
    );

    if (collection === "reminders") {
      await setDocument(
        `scheduledReminders/${user.sub}_${id}`,
        {
          ...sanitized,
          userId: user.sub,
          reminderId: id,
          createdAt: now,
          updatedAt: now,
        },
      );
    }

    return NextResponse.json(
      { item },
      { status: 201 },
    );
  } catch (error) {
    const status = Number(
      (error as { status?: number }).status ?? 400,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create record.",
      },
      { status },
    );
  }
}
