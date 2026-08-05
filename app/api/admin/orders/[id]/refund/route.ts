import { NextRequest, NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import { createRefund } from "@/lib/commerce/stripe";
import { getDocument, mergeDocument } from "@/lib/firebase-admin-rest";
import { notifyUser } from "@/lib/notifications";
import { enforceRateLimit } from "@/lib/rate-limit";
import { assertSameOrigin, cleanText, validateJsonSize } from "@/lib/security";
import { requireAdmin } from "@/lib/server/require-user";
import type { Order } from "@/types/app";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Context) {
  try {
    assertSameOrigin(request);
    const admin = await requireAdmin(request);
    await enforceRateLimit(request, "admin-refund", 10, 60 * 60, admin.sub);
    const orderId = cleanText((await context.params).id, 80);
    const body = (await request.json()) as {
      amount?: unknown;
      restock?: unknown;
      reason?: unknown;
    };
    validateJsonSize(body, 5_000);

    const order = await getDocument<Order & Record<string, unknown>>(
      `merchantOrders/${orderId}`,
    );
    if (!order || !order.userId) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    if (!order.stripePaymentIntentId) {
      return NextResponse.json({ error: "Order has no Stripe payment to refund." }, { status: 409 });
    }
    if (["refund_pending", "refunded"].includes(order.status)) {
      return NextResponse.json({ error: "A refund is already pending or complete." }, { status: 409 });
    }

    const maximum = Number(order.amountPaid ?? order.total);
    const requested = body.amount === undefined ? maximum : Number(body.amount);
    if (!Number.isFinite(requested) || requested <= 0 || requested > maximum) {
      return NextResponse.json(
        { error: `Refund amount must be between ₹0.01 and ₹${maximum.toFixed(2)}.` },
        { status: 400 },
      );
    }

    const refund = await createRefund({
      paymentIntentId: order.stripePaymentIntentId,
      orderId,
      amountPaise: Math.round(requested * 100),
      reason:
        body.reason === "duplicate" || body.reason === "fraudulent"
          ? body.reason
          : "requested_by_customer",
    });
    const patch = {
      status: "refund_pending",
      refundId: refund.id,
      refundRequestedAmount: requested,
      restockOnRefund: body.restock === true,
      refundRequestedAt: new Date().toISOString(),
      refundRequestedBy: admin.email,
      updatedAt: new Date().toISOString(),
    };
    await Promise.all([
      mergeDocument(`merchantOrders/${orderId}`, patch),
      mergeDocument(`users/${order.userId}/orders/${orderId}`, patch),
    ]);
    await notifyUser(String(order.userId), {
      type: "order",
      title: `Refund started for ${orderId}`,
      body: `A refund of ₹${requested.toLocaleString("en-IN")} has been submitted to Stripe.`,
      href: `/orders?order=${encodeURIComponent(orderId)}`,
    });
    await writeAuditLog({
      action: "order.refund.requested",
      resourceType: "order",
      resourceId: orderId,
      actor: { id: admin.sub, email: admin.email, role: admin.role },
      request,
      metadata: { amount: requested, restock: body.restock === true, stripeRefundId: refund.id },
    });
    return NextResponse.json({ item: { ...order, ...patch }, refund });
  } catch (error) {
    const status = Number((error as { status?: number }).status ?? 400);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create refund." },
      { status },
    );
  }
}
