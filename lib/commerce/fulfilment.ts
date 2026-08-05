import { randomUUID } from "node:crypto";

import {
  assignShiprocketAwb,
  cancelShiprocketOrder,
  createShiprocketOrder,
  scheduleShiprocketPickup,
  shiprocketConfigured,
  trackShiprocketAwb,
} from "@/lib/commerce/shiprocket";
import { getDocument, mergeDocument, setDocument } from "@/lib/firebase-admin-rest";
import { notifyUser } from "@/lib/notifications";
import { captureException } from "@/lib/observability";
import type { Order, OrderStatus, Shipment, ShipmentStatus } from "@/types/app";

function orderPath(userId: string, orderId: string): string {
  return `users/${userId}/orders/${orderId}`;
}

async function patchOrder(order: Order, patch: Record<string, unknown>): Promise<void> {
  await Promise.all([
    mergeDocument(`merchantOrders/${order.id}`, patch),
    mergeDocument(orderPath(String(order.userId), order.id), patch),
  ]);
}

function mapTrackingStatus(raw: string): {
  shipment: ShipmentStatus;
  order: OrderStatus;
} {
  const value = raw.toLowerCase();
  if (value.includes("deliver") && !value.includes("out for")) {
    return { shipment: "delivered", order: "delivered" };
  }
  if (value.includes("out for delivery")) {
    return { shipment: "out_for_delivery", order: "out_for_delivery" };
  }
  if (value.includes("cancel") || value.includes("rto")) {
    return { shipment: "cancelled", order: "cancelled" };
  }
  if (value.includes("exception") || value.includes("undelivered")) {
    return { shipment: "exception", order: "shipped" };
  }
  if (
    value.includes("transit") ||
    value.includes("shipped") ||
    value.includes("pickup") ||
    value.includes("manifest")
  ) {
    return { shipment: "in_transit", order: "shipped" };
  }
  return { shipment: "created", order: "shipment_pending" };
}

export async function createShipmentForOrder(orderId: string): Promise<Shipment> {
  if (!shiprocketConfigured()) {
    throw Object.assign(new Error("Shiprocket is not configured."), { status: 503 });
  }
  const order = await getDocument<Order & Record<string, unknown>>(`merchantOrders/${orderId}`);
  if (!order) throw Object.assign(new Error("Order not found."), { status: 404 });
  if (!order.userId) throw new Error("Order owner is missing.");
  if (!["paid", "processing", "shipment_pending"].includes(order.status)) {
    throw Object.assign(
      new Error("A shipment can be created only for a paid order."),
      { status: 409 },
    );
  }

  const existingId = typeof order.shipmentId === "string" ? order.shipmentId : null;
  if (existingId) {
    const existing = await getDocument<Shipment & Record<string, unknown>>(
      `shipments/${existingId}`,
    );
    if (existing) return existing;
  }

  const shipmentId = `SHP-${randomUUID().split("-")[0].toUpperCase()}`;
  const now = new Date().toISOString();
  const created = await createShiprocketOrder(order);
  if (!created.shipment_id || !created.order_id) {
    throw new Error("Shiprocket did not return an order and shipment identifier.");
  }

  let shipment: Shipment = {
    id: shipmentId,
    orderId,
    userId: String(order.userId),
    provider: "shiprocket",
    status: "created",
    shiprocketOrderId: String(created.order_id),
    shiprocketShipmentId: String(created.shipment_id),
    createdAt: now,
    updatedAt: now,
  };

  await setDocument(`shipments/${shipmentId}`, shipment as unknown as Record<string, unknown>);
  await patchOrder(order, {
    shipmentId,
    shiprocketOrderId: shipment.shiprocketOrderId,
    shiprocketShipmentId: shipment.shiprocketShipmentId,
    status: "shipment_pending",
    updatedAt: now,
  });

  try {
    const awb = await assignShiprocketAwb(created.shipment_id);
    const data = awb.response?.data;
    if (data?.awb_code) {
      shipment = {
        ...shipment,
        status: "awb_assigned",
        awbCode: data.awb_code,
        courierName: data.courier_name,
        trackingUrl: `https://shiprocket.co/tracking/${encodeURIComponent(data.awb_code)}`,
        updatedAt: new Date().toISOString(),
      };
      await mergeDocument(`shipments/${shipmentId}`, shipment as unknown as Record<string, unknown>);
      await patchOrder(order, {
        awbCode: shipment.awbCode,
        courierName: shipment.courierName,
        trackingUrl: shipment.trackingUrl,
        status: "shipment_pending",
        updatedAt: shipment.updatedAt,
      });
      await scheduleShiprocketPickup(created.shipment_id).catch(async (error) => {
        await captureException(error, { operation: "shiprocket.pickup", orderId });
      });
    }
  } catch (error) {
    await captureException(error, { operation: "shiprocket.awb", orderId });
  }

  await notifyUser(String(order.userId), {
    type: "shipment",
    title: "Shipment created",
    body: shipment.awbCode
      ? `Order ${orderId} is prepared with AWB ${shipment.awbCode}.`
      : `Order ${orderId} was sent to the delivery provider and is awaiting courier assignment.`,
    href: `/orders?order=${encodeURIComponent(orderId)}`,
  });

  return shipment;
}

export async function cancelShipmentForOrder(orderId: string): Promise<Shipment> {
  const order = await getDocument<Order & Record<string, unknown>>(`merchantOrders/${orderId}`);
  if (!order || !order.userId) {
    throw Object.assign(new Error("Order not found."), { status: 404 });
  }
  if (!order.shipmentId || !order.shiprocketOrderId) {
    throw Object.assign(new Error("The order has no cancellable Shiprocket shipment."), {
      status: 409,
    });
  }
  if (["delivered", "out_for_delivery"].includes(order.status)) {
    throw Object.assign(
      new Error("This shipment has progressed too far for automatic cancellation."),
      { status: 409 },
    );
  }

  const shipment = await getDocument<Shipment & Record<string, unknown>>(
    `shipments/${order.shipmentId}`,
  );
  if (!shipment) {
    throw Object.assign(new Error("Shipment record not found."), { status: 404 });
  }

  await cancelShiprocketOrder([order.shiprocketOrderId]);
  const updatedAt = new Date().toISOString();
  const patch = {
    status: "cancelled" as const,
    rawStatus: "cancelled_by_merchant",
    updatedAt,
  };
  await mergeDocument(`shipments/${shipment.id}`, patch);
  await patchOrder(order, {
    status: "processing",
    trackingStatus: "Shipment cancelled; payment/refund action pending",
    updatedAt,
  });
  await notifyUser(String(order.userId), {
    type: "shipment",
    title: `Shipment cancelled for ${orderId}`,
    body: "The courier shipment was cancelled. Any payment refund is handled separately through Stripe.",
    href: `/orders?order=${encodeURIComponent(orderId)}`,
  });
  return { ...shipment, ...patch } as Shipment;
}

export async function syncShipmentTracking(orderId: string): Promise<Shipment> {
  const order = await getDocument<Order & Record<string, unknown>>(`merchantOrders/${orderId}`);
  if (!order || !order.userId) throw Object.assign(new Error("Order not found."), { status: 404 });
  if (!order.shipmentId || !order.awbCode) {
    throw Object.assign(new Error("The order does not have an assigned tracking number."), { status: 409 });
  }
  const shipment = await getDocument<Shipment & Record<string, unknown>>(
    `shipments/${order.shipmentId}`,
  );
  if (!shipment) throw Object.assign(new Error("Shipment record not found."), { status: 404 });

  const tracking = await trackShiprocketAwb(order.awbCode);
  const trackingData = (tracking.tracking_data ?? tracking) as Record<string, unknown>;
  const track = Array.isArray(trackingData.shipment_track)
    ? (trackingData.shipment_track[0] as Record<string, unknown> | undefined)
    : undefined;
  const rawStatus = String(
    track?.current_status ?? trackingData.shipment_status ?? trackingData.status ?? "created",
  );
  const mapped = mapTrackingStatus(rawStatus);
  const updatedAt = new Date().toISOString();
  const patch = {
    status: mapped.shipment,
    rawStatus,
    trackingSnapshot: tracking,
    updatedAt,
  };
  await mergeDocument(`shipments/${shipment.id}`, patch);
  await patchOrder(order, { status: mapped.order, updatedAt, trackingStatus: rawStatus });

  if (mapped.order !== order.status) {
    await notifyUser(String(order.userId), {
      type: "shipment",
      title: `Order ${orderId}: ${mapped.order.replaceAll("_", " ")}`,
      body: rawStatus,
      href: `/orders?order=${encodeURIComponent(orderId)}`,
    });
  }

  return { ...shipment, ...patch } as Shipment;
}

export async function applyShiprocketWebhook(input: {
  awbCode?: string;
  orderId?: string;
  status: string;
  payload: Record<string, unknown>;
}): Promise<void> {
  let order: (Order & Record<string, unknown> & { id: string }) | null = null;
  if (input.orderId) {
    order = await getDocument<Order & Record<string, unknown>>(
      `merchantOrders/${input.orderId}`,
    );
  }
  if (!order && input.awbCode) {
    const snapshot = await import("@/lib/firebase/admin").then(({ getAdminDb }) =>
      getAdminDb()
        .collection("merchantOrders")
        .where("awbCode", "==", input.awbCode)
        .limit(1)
        .get(),
    );
    const document = snapshot.docs[0];
    if (document) order = { ...(document.data() as Order & Record<string, unknown>), id: document.id };
  }
  if (!order || !order.userId) return;
  const mapped = mapTrackingStatus(input.status);
  const updatedAt = new Date().toISOString();
  if (order.shipmentId) {
    await mergeDocument(`shipments/${order.shipmentId}`, {
      status: mapped.shipment,
      rawStatus: input.status,
      lastWebhook: input.payload,
      updatedAt,
    });
  }
  await patchOrder(order, { status: mapped.order, trackingStatus: input.status, updatedAt });
  await notifyUser(String(order.userId), {
    type: "shipment",
    title: `Order ${order.id}: ${mapped.order.replaceAll("_", " ")}`,
    body: input.status,
    href: `/orders?order=${encodeURIComponent(order.id)}`,
  });
}
