import { NextRequest, NextResponse } from "next/server";

import { releaseExpiredReservations } from "@/lib/commerce/inventory";
import { runTransactionWithRetry } from "@/lib/firebase-admin-rest";
import { getAdminDb } from "@/lib/firebase/admin";
import { notifyUser } from "@/lib/notifications";
import { captureException } from "@/lib/observability";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

async function claimReminder(id: string): Promise<Record<string, unknown> | null> {
  return runTransactionWithRetry(async (transaction, db) => {
    const ref = db.collection("scheduledReminders").doc(id);
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) return null;
    const data = snapshot.data() ?? {};
    if (data.done === true || data.pushSentAt) return null;
    const processingAt = typeof data.processingAt === "string" ? Date.parse(data.processingAt) : 0;
    if (processingAt && Date.now() - processingAt < 10 * 60 * 1000) return null;
    transaction.update(ref, { processingAt: new Date().toISOString() });
    return { ...data, id };
  });
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized cron request." }, { status: 401 });
  }

  const now = new Date().toISOString();
  const db = getAdminDb();
  let delivered = 0;
  let failed = 0;
  const snapshot = await db
    .collection("scheduledReminders")
    .where("done", "==", false)
    .where("dueAt", "<=", now)
    .limit(100)
    .get();

  for (const document of snapshot.docs) {
    const reminder = await claimReminder(document.id);
    if (!reminder) continue;
    const userId = String(reminder.userId ?? "");
    const reminderId = String(reminder.reminderId ?? document.id);
    if (!userId) continue;
    try {
      await notifyUser(userId, {
        type: "reminder",
        title: String(reminder.title ?? "Plant care reminder"),
        body: reminder.plant
          ? `Due now for ${String(reminder.plant)}.`
          : "A scheduled PlantVerse care task is due now.",
        href: "/reminders",
        data: { reminderId },
      });
      const sentAt = new Date().toISOString();
      await Promise.all([
        db.collection("scheduledReminders").doc(document.id).set(
          { pushSentAt: sentAt, processingAt: null, updatedAt: sentAt },
          { merge: true },
        ),
        db
          .collection("users")
          .doc(userId)
          .collection("reminders")
          .doc(reminderId)
          .set({ pushSentAt: sentAt, updatedAt: sentAt }, { merge: true }),
      ]);
      delivered += 1;
    } catch (error) {
      failed += 1;
      await db.collection("scheduledReminders").doc(document.id).set(
        {
          processingAt: null,
          lastError: error instanceof Error ? error.message.slice(0, 500) : "Unknown error",
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
      await captureException(error, { operation: "reminder.cron", reminderId, userId });
    }
  }

  const releasedReservations = await releaseExpiredReservations(100).catch(() => 0);
  return NextResponse.json({
    success: true,
    scanned: snapshot.size,
    delivered,
    failed,
    releasedReservations,
    timestamp: new Date().toISOString(),
  });
}
