import { NextRequest, NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import {
  cancelShipmentForOrder,
  createShipmentForOrder,
  syncShipmentTracking,
} from "@/lib/commerce/fulfilment";
import { enforceRateLimit } from "@/lib/rate-limit";
import { assertSameOrigin, cleanText } from "@/lib/security";
import { requireAdmin } from "@/lib/server/require-user";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Context) {
  try {
    assertSameOrigin(request);
    const admin = await requireAdmin(request);
    await enforceRateLimit(request, "admin-shipment", 30, 60 * 60, admin.sub);
    const orderId = cleanText((await context.params).id, 80);
    const body = (await request.json().catch(() => ({}))) as { action?: string };
    const item =
      body.action === "sync"
        ? await syncShipmentTracking(orderId)
        : body.action === "cancel"
          ? await cancelShipmentForOrder(orderId)
          : await createShipmentForOrder(orderId);
    await writeAuditLog({
      action:
        body.action === "sync"
          ? "shipment.synced"
          : body.action === "cancel"
            ? "shipment.cancelled"
            : "shipment.created",
      resourceType: "shipment",
      resourceId: item.id,
      actor: { id: admin.sub, email: admin.email, role: admin.role },
      request,
      metadata: { orderId, status: item.status },
    });
    return NextResponse.json({ item });
  } catch (error) {
    const status = Number((error as { status?: number }).status ?? 400);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to manage shipment." },
      { status },
    );
  }
}
