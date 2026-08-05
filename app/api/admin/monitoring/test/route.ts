import { NextRequest, NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import { captureException } from "@/lib/observability";
import { enforceRateLimit } from "@/lib/rate-limit";
import { assertSameOrigin } from "@/lib/security";
import { requireAdmin } from "@/lib/server/require-user";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    assertSameOrigin(request);
    const admin = await requireAdmin(request);
    await enforceRateLimit(request, "admin-monitoring-test", 3, 24 * 60 * 60, admin.sub);

    if (!process.env.SENTRY_DSN) {
      return NextResponse.json(
        { error: "SENTRY_DSN is not configured." },
        { status: 503 },
      );
    }

    const marker = `monitoring-test-${crypto.randomUUID()}`;
    await captureException(new Error(`PlantVerse acceptance test: ${marker}`), {
      operation: "monitoring.acceptance",
      userId: admin.sub,
      marker,
    });
    await writeAuditLog({
      action: "monitoring.acceptance_test_sent",
      resourceType: "monitoring",
      resourceId: marker,
      actor: { id: admin.sub, email: admin.email, role: admin.role },
      request,
    });

    return NextResponse.json({ success: true, marker });
  } catch (error) {
    const status = Number((error as { status?: number }).status ?? 500);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Monitoring test failed." },
      { status },
    );
  }
}
