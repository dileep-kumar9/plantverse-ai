import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import { listDocuments, setDocument } from "@/lib/firebase-admin-rest";
import { enforceRateLimit } from "@/lib/rate-limit";
import { assertSameOrigin, cleanText } from "@/lib/security";
import { requireAdmin } from "@/lib/server/require-user";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const admin = await requireAdmin(request);
    await enforceRateLimit(request, "admin-experts-read", 120, 60, admin.sub);
    const items = await listDocuments<Record<string, unknown>>("experts", 200);
    return NextResponse.json({ items });
  } catch (error) {
    const status = Number((error as { status?: number }).status ?? 500);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load experts." }, { status });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    assertSameOrigin(request);
    const admin = await requireAdmin(request);
    await enforceRateLimit(request, "admin-experts-create", 30, 60, admin.sub);
    const body = (await request.json()) as Record<string, unknown>;
    const userId = cleanText(body.userId, 128);
    const email = cleanText(body.email, 254).toLowerCase();
    const displayName = cleanText(body.displayName, 120);
    const specialization = cleanText(body.specialization, 240);
    const credentials = cleanText(body.credentials, 1000);
    if (!userId || !email || !displayName || !specialization || !credentials) {
      return NextResponse.json({ error: "User, email, name, specialization and credentials are required." }, { status: 400 });
    }
    const id = userId || randomUUID();
    const now = new Date().toISOString();
    const item = await setDocument(`experts/${id}`, {
      userId,
      email,
      displayName,
      specialization,
      credentials,
      status: "verified",
      verifiedBy: admin.sub,
      verifiedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    await writeAuditLog({
      action: "expert.verified",
      resourceType: "expert",
      resourceId: id,
      actor: { id: admin.sub, email: admin.email, role: admin.role },
      request,
      metadata: { expertEmail: email },
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    const status = Number((error as { status?: number }).status ?? 400);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create expert profile." }, { status });
  }
}
