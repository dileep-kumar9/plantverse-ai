import { NextRequest, NextResponse } from "next/server";

import { getAdminDb } from "@/lib/firebase/admin";
import { enforceRateLimit } from "@/lib/rate-limit";
import { requireAdmin } from "@/lib/server/require-user";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const admin = await requireAdmin(request);
    await enforceRateLimit(request, "admin-audit-read", 120, 60, admin.sub);
    const limit = Math.max(1, Math.min(200, Number(request.nextUrl.searchParams.get("limit")) || 100));
    const snapshot = await getAdminDb().collection("auditLogs").orderBy("createdAt", "desc").limit(limit).get();
    return NextResponse.json({ items: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) });
  } catch (error) {
    const status = Number((error as { status?: number }).status ?? 500);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load audit logs." }, { status });
  }
}
