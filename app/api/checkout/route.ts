import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import { sanitizeShippingAddress } from "@/lib/commerce/address";
import {
  normalizeInventoryRequest,
  releaseInventoryReservation,
  reserveInventory,
} from "@/lib/commerce/inventory";
import { createHostedCheckout } from "@/lib/commerce/stripe";
import { setDocument } from "@/lib/firebase-admin-rest";
import { captureException } from "@/lib/observability";
import { enforceRateLimit } from "@/lib/rate-limit";
import { assertSameOrigin, validateJsonSize } from "@/lib/security";
import { requireUser } from "@/lib/server/require-user";
import type { Order } from "@/types/app";

export const runtime = "nodejs";

type CheckoutBody = {
  items?: Array<{ id?: unknown; quantity?: unknown }>;
  address?: unknown;
};

export async function POST(request: NextRequest) {
  let createdOrderId: string | null = null;
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    await enforceRateLimit(request, "checkout", 8, 15 * 60, user.sub);

    if (process.env.ENABLE_COMMERCE !== "true") {
      return NextResponse.json(
        { error: "Commerce is not enabled by the service operator." },
        { status: 503 },
      );
    }
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Secure checkout is not configured." }, { status: 503 });
    }

    const body = (await request.json()) as CheckoutBody;
    validateJsonSize(body, 30_000);
    const address = sanitizeShippingAddress(body.address);
    const requestedItems = normalizeInventoryRequest(
      Array.isArray(body.items) ? body.items : [],
    );
    if (!requestedItems.length) {
      return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
    }

    const orderId = `PV-${randomUUID().split("-")[0].toUpperCase()}`;
    createdOrderId = orderId;
    const stripeExpiresAt = new Date(Date.now() + 31 * 60 * 1000);
    const reservationExpiresAt = new Date(Date.now() + 40 * 60 * 1000);
    const reservation = await reserveInventory({
      orderId,
      userId: user.sub,
      items: requestedItems,
      expiresAt: reservationExpiresAt,
    });

    const total = Number(
      reservation.items
        .reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
        .toFixed(2),
    );
    const createdAt = new Date().toISOString();
    const order: Order = {
      id: orderId,
      orderNumber: orderId,
      userId: user.sub,
      customerEmail: user.email,
      items: reservation.items.map((item) => ({
        id: item.productId,
        sku: item.sku,
        name: item.name,
        price: item.unitPrice,
        quantity: item.quantity,
        icon: item.icon,
        category: item.category,
        tag: item.tag,
        weightKg: item.weightKg,
        lengthCm: item.lengthCm,
        breadthCm: item.breadthCm,
        heightCm: item.heightCm,
      })) as Order["items"],
      total,
      currency: "INR",
      status: "awaiting_payment",
      address,
      createdAt,
      updatedAt: createdAt,
      reservationId: orderId,
    };

    await Promise.all([
      setDocument(`users/${user.sub}/orders/${orderId}`, order as unknown as Record<string, unknown>),
      setDocument(`merchantOrders/${orderId}`, order as unknown as Record<string, unknown>),
    ]);

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin).replace(/\/$/, "");
    const checkout = await createHostedCheckout({
      orderId,
      userId: user.sub,
      customerEmail: user.email,
      address,
      items: reservation.items,
      appUrl,
      expiresAt: stripeExpiresAt,
    });

    const updatedAt = new Date().toISOString();
    const patch = {
      stripeCheckoutSessionId: checkout.id,
      checkoutExpiresAt: stripeExpiresAt.toISOString(),
      updatedAt,
    };
    await Promise.all([
      setDocument(`users/${user.sub}/orders/${orderId}`, { ...order, ...patch } as unknown as Record<string, unknown>),
      setDocument(`merchantOrders/${orderId}`, { ...order, ...patch } as unknown as Record<string, unknown>),
    ]);

    await writeAuditLog({
      action: "checkout.created",
      resourceType: "order",
      resourceId: orderId,
      actor: { id: user.sub, email: user.email, role: user.role },
      request,
      metadata: { total, itemCount: reservation.items.length },
    });

    return NextResponse.json({ url: checkout.url, orderId });
  } catch (error) {
    if (createdOrderId) {
      await releaseInventoryReservation(createdOrderId, "checkout_creation_failed").catch(() => undefined);
    }
    await captureException(error, { route: "/api/checkout", orderId: createdOrderId });
    const status = Number((error as { status?: number }).status ?? 400);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to start checkout." },
      { status },
    );
  }
}
