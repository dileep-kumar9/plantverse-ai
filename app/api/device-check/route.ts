import { NextRequest, NextResponse } from "next/server";
import { DEVICE_CATALOG } from "@/lib/app-data";
import { enforceRateLimit } from "@/lib/rate-limit";
import { assertSameOrigin, cleanText } from "@/lib/security";
import { requireUser } from "@/lib/server/require-user";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    await enforceRateLimit(request, "device-check", 40, 60 * 60, user.sub);
    const body = (await request.json()) as { query?: string };
    const query = cleanText(body.query, 200);
    if (!query) return NextResponse.json({ error: "Enter a device model or product name." }, { status: 400 });
    const normalized = query.toLowerCase();
    const exact = DEVICE_CATALOG.find(
      (device) =>
        `${device.brand} ${device.model}`.toLowerCase().includes(normalized) ||
        normalized.includes(device.model.toLowerCase()),
    );
    return NextResponse.json({
      result:
        exact ??
        {
          brand: "Unknown",
          model: query,
          status: "verify",
          methods: ["manual"],
          features: ["Manual readings"],
          notes: "Manual entry works with any meter. Direct connection requires the model's published Bluetooth, Wi-Fi, serial, or cloud protocol.",
        },
    });
  } catch (error) {
    const status = Number((error as { status?: number }).status ?? 400);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to check the device." }, { status });
  }
}
