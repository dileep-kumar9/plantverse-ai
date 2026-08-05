import { NextRequest, NextResponse } from "next/server";

import { getDocument, listDocuments } from "@/lib/firebase-admin-rest";
import { getAdminDb } from "@/lib/firebase/admin";
import { enforceRateLimit } from "@/lib/rate-limit";
import { requireUser } from "@/lib/server/require-user";

export const runtime = "nodejs";

const exportCollections = [
  "analyses",
  "plants",
  "reminders",
  "settings",
  "profile",
  "cart",
  "orders",
  "notifications",
  "chats",
  "devices",
] as const;

function serialize(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(serialize);
  if (value && typeof value === "object") {
    const maybeTimestamp = value as { toDate?: () => Date };
    if (typeof maybeTimestamp.toDate === "function") {
      return maybeTimestamp.toDate().toISOString();
    }
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        serialize(item),
      ]),
    );
  }
  return value;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireUser(request);
    await enforceRateLimit(request, "account-export", 3, 24 * 60 * 60, user.sub);

    const db = getAdminDb();
    const [entries, communitySnapshot, tokenSnapshot] = await Promise.all([
      Promise.all(
        exportCollections.map(
          async (collection) =>
            [
              collection,
              await listDocuments(`users/${user.sub}/${collection}`, 1000),
            ] as const,
        ),
      ),
      db.collection("communityPosts").where("authorId", "==", user.sub).get(),
      db.collection("users").doc(user.sub).collection("pushTokens").get(),
    ]);

    const profile = await getDocument<Record<string, unknown>>(`users/${user.sub}`);
    const communityPosts = communitySnapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    }));
    const pushRegistrations = tokenSnapshot.docs.map((document) => {
      const data = document.data();
      return {
        id: document.id,
        platform: data.platform ?? null,
        permission: data.permission ?? null,
        userAgent: data.userAgent ?? null,
        createdAt: data.createdAt ?? null,
        updatedAt: data.updatedAt ?? null,
      };
    });

    const payload = serialize({
      format: "plantverse-account-export-v1",
      exportedAt: new Date().toISOString(),
      account: {
        uid: user.sub,
        email: user.email,
        profile,
      },
      data: {
        ...Object.fromEntries(entries),
        communityPosts,
        pushRegistrations,
      },
    });

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="plantverse-export-${new Date().toISOString().slice(0, 10)}.json"`,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    const status = Number((error as { status?: number }).status ?? 500);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to export account data." },
      { status },
    );
  }
}
