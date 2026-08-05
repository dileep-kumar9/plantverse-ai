import { NextRequest, NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import { listBackupRequests, startFirestoreExport } from "@/lib/backups";
import { enforceRateLimit } from "@/lib/rate-limit";
import { assertSameOrigin } from "@/lib/security";
import { requireAdmin } from "@/lib/server/require-user";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const admin = await requireAdmin(request);
    await enforceRateLimit(request, "admin-backups-read", 60, 60, admin.sub);
    return NextResponse.json({ items: await listBackupRequests() });
  } catch (error) {
    const status = Number((error as { status?: number }).status ?? 500);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to list backups." }, { status });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    assertSameOrigin(request);
    const admin = await requireAdmin(request);
    await enforceRateLimit(request, "admin-backup-create", 2, 24 * 60 * 60, admin.sub);
    const backup = await startFirestoreExport(admin.sub);
    await writeAuditLog({
      action: "backup.firestore.export_requested",
      resourceType: "backup",
      resourceId: backup.requestId,
      actor: { id: admin.sub, email: admin.email, role: admin.role },
      request,
      metadata: { operationName: backup.operationName, outputUriPrefix: backup.outputUriPrefix },
    });
    return NextResponse.json({ item: backup }, { status: 202 });
  } catch (error) {
    const status = Number((error as { status?: number }).status ?? 500);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to start backup." }, { status });
  }
}
