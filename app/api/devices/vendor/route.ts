import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import { setDocument } from "@/lib/firebase-admin-rest";
import { cleanText } from "@/lib/security";

export const runtime = "nodejs";

function verify(payload: string, signature: string, secret: string): boolean {
  const normalized = signature.replace(/^sha256=/i, "").trim();
  if (!/^[a-f0-9]{64}$/i.test(normalized)) return false;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  const left = Buffer.from(expected, "hex");
  const right = Buffer.from(normalized, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}

function optionalNumber(value: unknown, minimum: number, maximum: number): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(minimum, Math.min(maximum, parsed));
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.DEVICE_VENDOR_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Vendor gateway is not configured." }, { status: 503 });
  const payload = await request.text();
  const signature = request.headers.get("x-plantverse-signature") ?? "";
  if (!verify(payload, signature, secret)) {
    return NextResponse.json({ error: "Invalid gateway signature." }, { status: 401 });
  }

  try {
    const body = JSON.parse(payload) as Record<string, unknown>;
    const userId = cleanText(body.userId, 128);
    const deviceId = cleanText(body.deviceId, 128);
    const provider = cleanText(body.provider, 80);
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(userId) || !/^[A-Za-z0-9_-]{1,128}$/.test(deviceId)) {
      return NextResponse.json({ error: "Valid userId and deviceId are required." }, { status: 400 });
    }
    const timestamp = body.timestamp ? new Date(String(body.timestamp)) : new Date();
    if (Number.isNaN(timestamp.valueOf()) || Math.abs(Date.now() - timestamp.valueOf()) > 24 * 60 * 60 * 1000) {
      return NextResponse.json({ error: "Reading timestamp is invalid or stale." }, { status: 400 });
    }
    const id = `${deviceId}_${timestamp.toISOString().replace(/[^0-9]/g, "").slice(0, 14)}`;
    const item = await setDocument(`users/${userId}/devices/${id}`, {
      device: cleanText(body.deviceName || deviceId, 160),
      deviceId,
      provider,
      connectionMethod: "vendor-api",
      moisture: optionalNumber(body.moisture, 0, 100),
      ph: optionalNumber(body.ph, 0, 14),
      temperature: optionalNumber(body.temperature, -50, 100),
      humidity: optionalNumber(body.humidity, 0, 100),
      ec: optionalNumber(body.ec, 0, 100_000),
      note: cleanText(body.note, 500),
      raw: cleanText(body.raw, 2_000),
      createdAt: timestamp.toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await writeAuditLog({
      action: "device.vendor.reading_received",
      resourceType: "deviceReading",
      resourceId: id,
      actor: { id: `gateway:${provider || "custom"}`, role: "system" },
      request,
      metadata: { userId, deviceId, provider },
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to process vendor reading." }, { status: 400 });
  }
}
