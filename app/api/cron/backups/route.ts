import { NextRequest, NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import { startFirestoreExport } from "@/lib/backups";
import { captureException } from "@/lib/observability";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized cron request." }, { status: 401 });
  }

  if (process.env.ENABLE_SCHEDULED_BACKUPS !== "true") {
    return NextResponse.json({ success: true, status: "disabled" });
  }

  try {
    const backup = await startFirestoreExport("system:scheduled-backup");
    await writeAuditLog({
      action: "backup.firestore.scheduled_export_requested",
      resourceType: "backup",
      resourceId: backup.requestId,
      actor: { id: "system:scheduled-backup", role: "system" },
      metadata: {
        operationName: backup.operationName,
        outputUriPrefix: backup.outputUriPrefix,
      },
    });
    return NextResponse.json({ success: true, item: backup }, { status: 202 });
  } catch (error) {
    await captureException(error, { operation: "backup.cron" });
    await writeAuditLog({
      action: "backup.firestore.scheduled_export_failed",
      resourceType: "backup",
      actor: { id: "system:scheduled-backup", role: "system" },
      outcome: "failure",
      metadata: {
        message: error instanceof Error ? error.message.slice(0, 500) : "Unknown error",
      },
    }).catch(() => undefined);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Scheduled backup failed." },
      { status: 500 },
    );
  }
}
