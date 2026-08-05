import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import { applyShiprocketWebhook } from "@/lib/commerce/fulfilment";
import { getAdminDb } from "@/lib/firebase/admin";
import { captureException } from "@/lib/observability";

export const runtime = "nodejs";

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function verifiedGatewaySignature(raw: string, supplied: string, secret: string): boolean {
  const normalized = supplied.trim().replace(/^sha256=/i, "").toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(normalized)) return false;
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  return safeEqual(normalized, expected);
}

export async function POST(request: NextRequest) {
  const secret = process.env.SHIPROCKET_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Shiprocket webhook gateway is not configured." },
      { status: 503 },
    );
  }

  const raw = await request.text();
  const signature = request.headers.get("x-plantverse-signature") ?? "";
  if (!verifiedGatewaySignature(raw, signature, secret)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  const eventId = createHash("sha256").update(raw).digest("hex");
  const ref = getAdminDb().collection("webhookEvents").doc(`shiprocket_${eventId}`);
  try {
    await ref.create({
      provider: "shiprocket",
      eventId,
      receivedAt: new Date().toISOString(),
      status: "processing",
    });
  } catch (error) {
    const code = String((error as { code?: string | number }).code ?? "").toUpperCase();
    if (code === "6" || code.includes("ALREADY_EXISTS")) {
      return NextResponse.json({ received: true, duplicate: true });
    }
    throw error;
  }

  try {
    const payload = JSON.parse(raw) as Record<string, unknown>;
    const awbCode = String(payload.awb ?? payload.awb_code ?? payload.awbCode ?? "").trim();
    const orderId = String(
      payload.order_id ?? payload.orderId ?? payload.channel_order_id ?? "",
    ).trim();
    const status = String(
      payload.current_status ?? payload.status ?? payload.shipment_status ?? "updated",
    ).trim();
    await applyShiprocketWebhook({ awbCode, orderId, status, payload });
    await ref.set(
      { status: "processed", processedAt: new Date().toISOString() },
      { merge: true },
    );
    await writeAuditLog({
      action: "shiprocket.webhook.received",
      resourceType: "webhook",
      resourceId: eventId,
      actor: { id: "shiprocket-gateway", role: "system" },
      metadata: { awbCode, orderId, status },
    });
    return NextResponse.json({ received: true });
  } catch (error) {
    await ref.set(
      {
        status: "failed",
        processedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message.slice(0, 1_000) : "Unknown error",
      },
      { merge: true },
    );
    await captureException(error, { route: "/api/shiprocket/webhook", eventId });
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
