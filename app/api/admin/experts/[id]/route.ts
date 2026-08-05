import { NextRequest, NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import { mergeDocument } from "@/lib/firebase-admin-rest";
import { safeDocumentId } from "@/lib/data-collections";
import { enforceRateLimit } from "@/lib/rate-limit";
import { assertSameOrigin, cleanText } from "@/lib/security";
import { requireAdmin } from "@/lib/server/require-user";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Context): Promise<NextResponse> {
  try {
    assertSameOrigin(request);
    const admin = await requireAdmin(request);
    await enforceRateLimit(request, "admin-experts-update", 60, 60, admin.sub);
    const { id } = await context.params;
    const safeId = safeDocumentId(id);
    const body = (await request.json()) as Record<string, unknown>;
    const status = cleanText(body.status, 30);
    if (!["verified", "suspended", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid expert status." }, { status: 400 });
    }
    const item = await mergeDocument(`experts/${safeId}`, {
      status,
      reviewNote: cleanText(body.reviewNote, 1000),
      reviewedBy: admin.sub,
      updatedAt: new Date().toISOString(),
    });
    await writeAuditLog({
      action: `expert.${status}`,
      resourceType: "expert",
      resourceId: safeId,
      actor: { id: admin.sub, email: admin.email, role: admin.role },
      request,
    });
    return NextResponse.json({ item });
  } catch (error) {
    const status = Number((error as { status?: number }).status ?? 400);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update expert." }, { status });
  }
}
