import { NextRequest, NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import { createShipmentForOrder } from "@/lib/commerce/fulfilment";
import {
  fulfillInventoryReservation,
  releaseInventoryReservation,
  restockFulfilledOrder,
} from "@/lib/commerce/inventory";
import { verifyStripeSignature } from "@/lib/commerce/stripe";
import { getAdminDb } from "@/lib/firebase/admin";
import { deleteDocument, getDocument, mergeDocument } from "@/lib/firebase-admin-rest";
import { notifyUser } from "@/lib/notifications";
import { captureException } from "@/lib/observability";
import type { Order } from "@/types/app";

export const runtime = "nodejs";

async function claimEvent(id: string, type: string): Promise<boolean> {
  try {
    await getAdminDb().collection("webhookEvents").doc(`stripe_${id}`).create({
      provider: "stripe",
      eventId: id,
      type,
      receivedAt: new Date().toISOString(),
      status: "processing",
    });
    return true;
  } catch (error) {
    const code = String((error as { code?: string | number }).code ?? "").toUpperCase();
    if (code === "6" || code.includes("ALREADY_EXISTS")) return false;
    throw error;
  }
}

async function completeEvent(id: string, status: "processed" | "failed", error?: unknown) {
  await getAdminDb().collection("webhookEvents").doc(`stripe_${id}`).set(
    {
      status,
      processedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message.slice(0, 1_000) : null,
    },
    { merge: true },
  );
}

async function findOrder(
  metadata: Record<string, string>,
  object: Record<string, unknown>,
): Promise<(Order & Record<string, unknown> & { id: string }) | null> {
  const orderId = metadata.orderId || String(object.client_reference_id ?? "");
  if (orderId) return getDocument<Order & Record<string, unknown>>(`merchantOrders/${orderId}`);
  const paymentIntentId = String(object.payment_intent ?? "");
  if (!paymentIntentId) return null;
  const snapshot = await getAdminDb()
    .collection("merchantOrders")
    .where("stripePaymentIntentId", "==", paymentIntentId)
    .limit(1)
    .get();
  const item = snapshot.docs[0];
  return item
    ? ({ ...(item.data() as Order & Record<string, unknown>), id: item.id } as Order &
        Record<string, unknown> & { id: string })
    : null;
}

async function patchOrder(order: Order & { id: string }, patch: Record<string, unknown>) {
  if (!order.userId) throw new Error("Order owner is missing.");
  await Promise.all([
    mergeDocument(`merchantOrders/${order.id}`, patch),
    mergeDocument(`users/${order.userId}/orders/${order.id}`, patch),
  ]);
}

async function clearPurchasedCart(order: Order & { id: string }) {
  if (!order.userId) return;
  const ids = [...new Set(order.items.map((item) => item.id).filter(Boolean))];
  await Promise.all(
    ids.map((id) => deleteDocument(`users/${order.userId}/cart/${id}`).catch(() => undefined)),
  );
}

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";
  if (!verifyStripeSignature(payload, signature, secret)) {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  let eventId = "unknown";
  try {
    const event = JSON.parse(payload) as {
      id: string;
      type: string;
      data: { object: Record<string, unknown> };
    };
    eventId = event.id;
    if (!(await claimEvent(event.id, event.type))) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    const object = event.data.object;
    const metadata = (object.metadata ?? {}) as Record<string, string>;
    const order = await findOrder(metadata, object);

    if (
      (event.type === "checkout.session.completed" ||
        event.type === "checkout.session.async_payment_succeeded") &&
      order
    ) {
      const paid =
        event.type === "checkout.session.async_payment_succeeded" ||
        object.payment_status === "paid";
      const updatedAt = new Date().toISOString();
      if (paid) await fulfillInventoryReservation(order.id);
      await patchOrder(order, {
        status: paid ? "paid" : "awaiting_payment",
        stripeCheckoutSessionId: String(object.id ?? order.stripeCheckoutSessionId ?? ""),
        stripePaymentIntentId: String(object.payment_intent ?? ""),
        amountPaid: Number(object.amount_total ?? 0) / 100,
        stripeEventId: event.id,
        paidAt: paid ? updatedAt : null,
        updatedAt,
      });
      if (paid) {
        await clearPurchasedCart(order);
        await notifyUser(String(order.userId), {
          type: "order",
          title: `Payment received for ${order.id}`,
          body: "Your order is confirmed and will move to fulfilment.",
          href: `/orders?order=${encodeURIComponent(order.id)}`,
        });
        if (process.env.AUTO_FULFIL_PAID_ORDERS === "true") {
          void createShipmentForOrder(order.id).catch(async (error) => {
            await captureException(error, { operation: "autoFulfil", orderId: order.id });
          });
        }
      }
    }

    if (
      (event.type === "checkout.session.expired" ||
        event.type === "checkout.session.async_payment_failed" ||
        event.type === "payment_intent.payment_failed") &&
      order
    ) {
      await releaseInventoryReservation(order.id, event.type);
      await patchOrder(order, {
        status: event.type === "checkout.session.expired" ? "payment_expired" : "payment_failed",
        stripeEventId: event.id,
        updatedAt: new Date().toISOString(),
      });
      await notifyUser(String(order.userId), {
        type: "order",
        title: `Payment not completed for ${order.id}`,
        body: "Reserved inventory was released. You may try checkout again.",
        href: "/cart",
      });
    }

    if (event.type === "refund.failed" && order) {
      await patchOrder(order, {
        status: "refund_failed",
        refundFailureReason: String(object.failure_reason ?? "provider_failed"),
        stripeEventId: event.id,
        updatedAt: new Date().toISOString(),
      });
      await notifyUser(String(order.userId), {
        type: "order",
        title: `Refund needs attention for ${order.id}`,
        body: "The payment provider reported that the refund failed. Support will review it.",
        href: `/orders?order=${encodeURIComponent(order.id)}`,
      });
    }

    if (event.type === "charge.refunded" && order) {
      const amount = Number(object.amount ?? 0);
      const refunded = Number(object.amount_refunded ?? 0);
      const fullyRefunded = amount > 0 && refunded >= amount;
      if (fullyRefunded && order.restockOnRefund === true) {
        await restockFulfilledOrder(order.id);
      }
      await patchOrder(order, {
        status: fullyRefunded ? "refunded" : "refund_pending",
        refundAmount: refunded / 100,
        stripeEventId: event.id,
        refundedAt: fullyRefunded ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString(),
      });
      await notifyUser(String(order.userId), {
        type: "order",
        title: fullyRefunded ? `Refund completed for ${order.id}` : `Partial refund updated for ${order.id}`,
        body: `Refunded amount: ₹${(refunded / 100).toLocaleString("en-IN")}.`,
        href: `/orders?order=${encodeURIComponent(order.id)}`,
      });
    }

    await writeAuditLog({
      action: `stripe.${event.type}`,
      resourceType: "webhook",
      resourceId: event.id,
      actor: { id: "stripe", role: "system" },
      metadata: { orderId: order?.id ?? null },
    });
    await completeEvent(event.id, "processed");
    return NextResponse.json({ received: true });
  } catch (error) {
    await completeEvent(eventId, "failed", error).catch(() => undefined);
    await captureException(error, { route: "/api/stripe/webhook", eventId });
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
