import { NextRequest, NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import { validateManualOrderTransition } from "@/lib/commerce/order-policy";
import { getDocument, mergeDocument } from "@/lib/firebase-admin-rest";
import { enforceRateLimit } from "@/lib/rate-limit";
import { assertSameOrigin, cleanText, validateJsonSize } from "@/lib/security";
import { requireAdmin } from "@/lib/server/require-user";
import type { Order, OrderStatus } from "@/types/app";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  try {
    assertSameOrigin(request);
    const admin = await requireAdmin(request);
    await enforceRateLimit(request, "admin-order-update", 60, 60, admin.sub);
    const orderId = cleanText((await context.params).id, 80);
    const body = (await request.json()) as { status?: OrderStatus };
    validateJsonSize(body, 2_000);
    if (!body.status) {
      return NextResponse.json({ error: "Order status is required." }, { status: 400 });
    }

    const order = await getDocument<Order & Record<string, unknown>>(
      `merchantOrders/${orderId}`,
    );
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    if (!order.userId) return NextResponse.json({ error: "Order owner is missing." }, { status: 409 });

    const transition = validateManualOrderTransition({
      current: order.status,
      requested: body.status,
      hasStripePayment: Boolean(order.stripePaymentIntentId),
    });
    if (!transition.ok) {
      return NextResponse.json({ error: transition.message }, { status: 409 });
    }

    const patch = {
      status: body.status,
      updatedAt: new Date().toISOString(),
      updatedBy: admin.email,
    };
    await Promise.all([
      mergeDocument(`merchantOrders/${orderId}`, patch),
      mergeDocument(`users/${order.userId}/orders/${orderId}`, patch),
    ]);
    await writeAuditLog({
      action: "order.status.manual_update",
      resourceType: "order",
      resourceId: orderId,
      actor: { id: admin.sub, email: admin.email, role: admin.role },
      request,
      metadata: { from: order.status, to: body.status },
    });
    return NextResponse.json({ item: { ...order, ...patch, id: orderId } });
  } catch (error) {
    const status = Number((error as { status?: number }).status ?? 500);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update order." },
      { status },
    );
  }
}
