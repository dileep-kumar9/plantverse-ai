import { createHash } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import { getAdminDb } from "@/lib/firebase/admin";
import { enforceRateLimit } from "@/lib/rate-limit";
import { assertSameOrigin, cleanText, validateJsonSize } from "@/lib/security";
import { requireUser } from "@/lib/server/require-user";

function tokenId(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    await enforceRateLimit(request, "push-token", 20, 60 * 60, user.sub);
    const body = (await request.json()) as { token?: unknown; permission?: unknown };
    validateJsonSize(body, 10_000);
    const token = cleanText(body.token, 4_096);
    if (token.length < 30) {
      return NextResponse.json({ error: "A valid FCM registration token is required." }, { status: 400 });
    }
    const id = tokenId(token);
    await getAdminDb()
      .collection("users")
      .doc(user.sub)
      .collection("pushTokens")
      .doc(id)
      .set(
        {
          token,
          platform: "web",
          permission: body.permission === "granted" ? "granted" : "unknown",
          userAgent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
          updatedAt: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    await writeAuditLog({
      action: "push.token.registered",
      resourceType: "pushToken",
      resourceId: id,
      actor: { id: user.sub, email: user.email, role: user.role },
      request,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const status = Number((error as { status?: number }).status ?? 400);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to register notifications." },
      { status },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    const body = (await request.json()) as { token?: unknown };
    const token = cleanText(body.token, 4_096);
    if (token.length >= 30) {
      await getAdminDb()
        .collection("users")
        .doc(user.sub)
        .collection("pushTokens")
        .doc(tokenId(token))
        .delete();
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    const status = Number((error as { status?: number }).status ?? 400);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to disable notifications." },
      { status },
    );
  }
}
