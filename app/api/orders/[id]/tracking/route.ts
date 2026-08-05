import { NextRequest, NextResponse } from "next/server";

import { syncShipmentTracking } from "@/lib/commerce/fulfilment";
import { getDocument } from "@/lib/firebase-admin-rest";
import { enforceRateLimit } from "@/lib/rate-limit";
import { cleanText } from "@/lib/security";
import { requireUser } from "@/lib/server/require-user";
import type { Order } from "@/types/app";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Context) {
  try {
    const user = await requireUser(request);
    await enforceRateLimit(request, "order-tracking", 30, 60, user.sub);
    const orderId = cleanText((await context.params).id, 80);
    const order = await getDocument<Order & Record<string, unknown>>(
      `users/${user.sub}/orders/${orderId}`,
    );
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    if (!order.awbCode) {
      return NextResponse.json({ order, shipment: null, message: "Tracking is not assigned yet." });
    }
    const shipment = await syncShipmentTracking(orderId);
    return NextResponse.json({ order: { ...order, status: shipment.status }, shipment });
  } catch (error) {
    const status = Number((error as { status?: number }).status ?? 400);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load tracking." },
      { status },
    );
  }
}
