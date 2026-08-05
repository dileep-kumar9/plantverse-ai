import { randomUUID } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb, getAdminMessaging } from "@/lib/firebase/admin";
import { captureException } from "@/lib/observability";
import type { InAppNotification } from "@/types/app";

export type NotificationInput = {
  type: InAppNotification["type"];
  title: string;
  body: string;
  href?: string;
  data?: Record<string, string>;
};

export async function createInAppNotification(
  userId: string,
  input: NotificationInput,
): Promise<InAppNotification> {
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const notification: InAppNotification = {
    id,
    type: input.type,
    title: input.title.slice(0, 140),
    body: input.body.slice(0, 500),
    href: input.href?.slice(0, 500),
    read: false,
    createdAt,
  };
  await getAdminDb()
    .collection("users")
    .doc(userId)
    .collection("notifications")
    .doc(id)
    .set({ ...notification, data: input.data ?? {}, createdAtServer: FieldValue.serverTimestamp() });
  return notification;
}

export async function sendPushToUser(
  userId: string,
  input: NotificationInput,
): Promise<{ attempted: number; succeeded: number; failed: number }> {
  const db = getAdminDb();
  const tokenSnapshot = await db
    .collection("users")
    .doc(userId)
    .collection("pushTokens")
    .limit(500)
    .get();
  const tokens = tokenSnapshot.docs
    .map((item) => ({ id: item.id, token: String(item.data().token ?? "") }))
    .filter((item) => item.token.length > 20);
  if (!tokens.length) return { attempted: 0, succeeded: 0, failed: 0 };

  try {
    const response = await getAdminMessaging().sendEachForMulticast({
      tokens: tokens.map((item) => item.token),
      notification: { title: input.title.slice(0, 140), body: input.body.slice(0, 500) },
      data: {
        type: input.type,
        href: input.href ?? "/notifications",
        ...(input.data ?? {}),
      },
      webpush: {
        fcmOptions: { link: input.href ?? "/notifications" },
        notification: {
          icon: "/icons/icon-192.png",
          badge: "/icons/badge-72.png",
          tag: `${input.type}-${userId}`,
          renotify: false,
        },
      },
    });

    const invalidIds: string[] = [];
    response.responses.forEach((item, index) => {
      const code = item.error?.code ?? "";
      if (
        code.includes("registration-token-not-registered") ||
        code.includes("invalid-registration-token") ||
        code.includes("invalid-argument")
      ) {
        invalidIds.push(tokens[index].id);
      }
    });
    if (invalidIds.length) {
      const batch = db.batch();
      invalidIds.forEach((id) =>
        batch.delete(db.collection("users").doc(userId).collection("pushTokens").doc(id)),
      );
      await batch.commit();
    }

    return {
      attempted: tokens.length,
      succeeded: response.successCount,
      failed: response.failureCount,
    };
  } catch (error) {
    await captureException(error, { operation: "sendPushToUser", userId });
    return { attempted: tokens.length, succeeded: 0, failed: tokens.length };
  }
}

export async function notifyUser(
  userId: string,
  input: NotificationInput,
): Promise<void> {
  await createInAppNotification(userId, input);
  await sendPushToUser(userId, input);
}
