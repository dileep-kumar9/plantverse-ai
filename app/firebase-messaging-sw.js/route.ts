import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function clientConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  };
}

export async function GET(): Promise<NextResponse> {
  const config = clientConfig();
  const configured = Boolean(
    config.apiKey &&
      config.authDomain &&
      config.projectId &&
      config.messagingSenderId &&
      config.appId,
  );

  const source = configured
    ? `/* PlantVerse Firebase Cloud Messaging service worker. */\nimportScripts("https://www.gstatic.com/firebasejs/12.17.0/firebase-app-compat.js");\nimportScripts("https://www.gstatic.com/firebasejs/12.17.0/firebase-messaging-compat.js");\n\nfirebase.initializeApp(${JSON.stringify(config)});\nfirebase.messaging();\n\nself.addEventListener("notificationclick", (event) => {\n  event.notification.close();\n  const requested = event.notification?.data?.FCM_MSG?.fcmOptions?.link || event.notification?.data?.href || "/notifications";\n  const target = new URL(requested, self.location.origin);\n  if (target.origin !== self.location.origin) return;\n  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {\n    for (const client of windows) {\n      if ("focus" in client && client.url === target.href) return client.focus();\n    }\n    return clients.openWindow ? clients.openWindow(target.href) : undefined;\n  }));\n});\n`
    : `/* Firebase browser configuration is incomplete. */\nself.addEventListener("install", () => self.skipWaiting());\n`;

  return new NextResponse(source, {
    headers: {
      "content-type": "application/javascript; charset=utf-8",
      "cache-control": "no-store, max-age=0",
      "service-worker-allowed": "/",
      "x-content-type-options": "nosniff",
    },
  });
}
