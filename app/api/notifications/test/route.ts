import { NextRequest, NextResponse } from "next/server";

import { notifyUser } from "@/lib/notifications";
import { enforceRateLimit } from "@/lib/rate-limit";
import { assertSameOrigin } from "@/lib/security";
import { requireUser } from "@/lib/server/require-user";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    await enforceRateLimit(request, "push-test", 3, 60 * 60, user.sub);
    await notifyUser(user.sub, {
      type: "system",
      title: "PlantVerse notifications are working",
      body: "You will receive enabled reminder, order and shipment updates on this device.",
      href: "/notifications",
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const status = Number((error as { status?: number }).status ?? 400);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to send test notification." },
      { status },
    );
  }
}
