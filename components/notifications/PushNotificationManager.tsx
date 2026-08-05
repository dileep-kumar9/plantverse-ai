"use client";

import { deleteToken, getToken, onMessage } from "firebase/messaging";
import { useEffect, useState } from "react";

import { getFirebaseMessaging } from "@/lib/firebase/client";

export default function PushNotificationManager() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    typeof Notification === "undefined" ? "unsupported" : Notification.permission,
  );
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    void getFirebaseMessaging().then((messaging) => {
      if (!messaging) return;
      unsubscribe = onMessage(messaging, (payload) => {
        setMessage(payload.notification?.title ?? "New PlantVerse notification received.");
      });
    });
    return () => unsubscribe?.();
  }, []);

  async function enable() {
    setBusy(true);
    setMessage("");
    try {
      const messaging = await getFirebaseMessaging();
      if (!messaging || typeof Notification === "undefined") {
        setPermission("unsupported");
        throw new Error("Web push is not supported by this browser.");
      }
      const nextPermission = await Notification.requestPermission();
      setPermission(nextPermission);
      if (nextPermission !== "granted") {
        throw new Error("Notification permission was not granted.");
      }
      const registration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js",
        { scope: "/" },
      );
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      if (!vapidKey) throw new Error("Firebase Web Push VAPID key is not configured.");
      const nextToken = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration,
      });
      if (!nextToken) throw new Error("Firebase did not return a push token.");
      const response = await fetch("/api/notifications/push-token", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ token: nextToken, permission: nextPermission }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Unable to register this device.");
      }
      setToken(nextToken);
      setMessage("Push notifications are enabled on this device.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to enable notifications.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const messaging = await getFirebaseMessaging();
      if (messaging && token) {
        await fetch("/api/notifications/push-token", {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ token }),
        });
        await deleteToken(messaging);
      }
      setToken(null);
      setMessage("Push notifications are disabled for this browser token.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to disable notifications.");
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    try {
      const response = await fetch("/api/notifications/test", {
        method: "POST",
        credentials: "same-origin",
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Unable to send a test notification.");
      }
      setMessage("Test notification queued.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to send a test.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="dashboard-panel">
      <h2 className="text-xl font-semibold">Browser push notifications</h2>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        Permission: <strong>{permission}</strong>. Notifications are registered per browser and may be disabled at any time.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" disabled={busy || permission === "unsupported"} onClick={() => void enable()} className="voice-button">Enable push</button>
        <button type="button" disabled={busy || !token} onClick={() => void test()} className="outline-button">Send test</button>
        <button type="button" disabled={busy || !token} onClick={() => void disable()} className="outline-button">Disable this token</button>
      </div>
      {message ? <p className="mt-4 text-sm text-[var(--text-secondary)]" role="status">{message}</p> : null}
    </section>
  );
}
