import { NextRequest, NextResponse } from "next/server";
import { listDocuments } from "@/lib/firebase-admin-rest";
import { enforceRateLimit } from "@/lib/rate-limit";
import { requireAdmin } from "@/lib/server/require-user";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    await enforceRateLimit(request, "admin-orders", 120, 60, admin.sub);
    const orders = await listDocuments<Record<string, unknown>>("merchantOrders", 100);
    orders.sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));
    return NextResponse.json({ items: orders });
  } catch (error) {
    const status = Number((error as { status?: number }).status ?? 500);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load orders." }, { status });
  }
}
