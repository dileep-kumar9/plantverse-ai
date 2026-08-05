import { NextRequest, NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import { clearSessionCookie } from "@/lib/auth/session";
import { releaseInventoryReservation } from "@/lib/commerce/inventory";
import { deleteDocument, deleteUserData, mergeDocument } from "@/lib/firebase-admin-rest";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { captureException } from "@/lib/observability";
import { enforceRateLimit } from "@/lib/rate-limit";
import { assertSameOrigin } from "@/lib/security";
import { requireUser } from "@/lib/server/require-user";

export const runtime = "nodejs";

type DeleteAccountBody = {
  idToken?: unknown;
  confirmation?: unknown;
};

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    await enforceRateLimit(request, "account-delete", 2, 24 * 60 * 60, user.sub);

    const body = (await request.json().catch(() => ({}))) as DeleteAccountBody;
    if (body.confirmation !== "DELETE MY ACCOUNT") {
      return NextResponse.json(
        { error: "Type DELETE MY ACCOUNT to confirm permanent deletion." },
        { status: 400 },
      );
    }
    if (typeof body.idToken !== "string" || body.idToken.length < 20) {
      return NextResponse.json(
        { error: "Sign in again before deleting your account.", code: "RECENT_LOGIN_REQUIRED" },
        { status: 401 },
      );
    }

    const decoded = await getAdminAuth().verifyIdToken(body.idToken, true);
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (
      decoded.uid !== user.sub ||
      !decoded.auth_time ||
      nowSeconds - decoded.auth_time > 5 * 60
    ) {
      return NextResponse.json(
        { error: "A recent sign-in is required.", code: "RECENT_LOGIN_REQUIRED" },
        { status: 401 },
      );
    }

    const db = getAdminDb();
    const [posts, merchantOrders, reservations, scheduledReminders, expertRecords] =
      await Promise.all([
        db.collection("communityPosts").where("authorId", "==", user.sub).get(),
        db.collection("merchantOrders").where("userId", "==", user.sub).get(),
        db
          .collection("inventoryReservations")
          .where("userId", "==", user.sub)
          .where("status", "==", "reserved")
          .get(),
        db.collection("scheduledReminders").where("userId", "==", user.sub).get(),
        db.collection("experts").where("userId", "==", user.sub).get(),
      ]);

    for (const reservation of reservations.docs) {
      await releaseInventoryReservation(reservation.id, "account_deleted");
    }

    const deletedAt = new Date().toISOString();
    await Promise.all([
      ...posts.docs.map((post) => deleteDocument(`communityPosts/${post.id}`)),
      ...scheduledReminders.docs.map((reminder) =>
        deleteDocument(`scheduledReminders/${reminder.id}`),
      ),
      ...expertRecords.docs.map((expert) => deleteDocument(`experts/${expert.id}`)),
      ...merchantOrders.docs.map((orderDocument) =>
        mergeDocument(`merchantOrders/${orderDocument.id}`, {
          userId: "deleted-account",
          customerEmail: "deleted-account",
          customerName: "Deleted account",
          address: null,
          shippingAddress: null,
          phone: null,
          accountDeletedAt: deletedAt,
          updatedAt: deletedAt,
        }),
      ),
    ]);

    await writeAuditLog({
      action: "account.deletion.requested",
      resourceType: "user",
      resourceId: user.sub,
      actor: { id: user.sub, role: user.role },
      request,
      metadata: {
        anonymizedOrders: merchantOrders.size,
        removedPosts: posts.size,
        releasedReservations: reservations.size,
        removedScheduledReminders: scheduledReminders.size,
        removedExpertRecords: expertRecords.size,
      },
    });

    await deleteUserData(user.sub);
    await getAdminAuth().deleteUser(user.sub);

    const response = NextResponse.json({ ok: true });
    clearSessionCookie(response);
    return response;
  } catch (error) {
    await captureException(error, { route: "/api/account", operation: "DELETE" });
    const status = Number((error as { status?: number }).status ?? 400);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete the account." },
      { status },
    );
  }
}
