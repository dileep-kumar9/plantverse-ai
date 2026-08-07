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

  const shell = String.raw`/* PlantVerse PWA + Firebase Cloud Messaging service worker. */
const CACHE_NAME = "plantverse-shell-v1";
const SHELL_ASSETS = [
  "/",
  "/offline",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const offline = await caches.match("/offline");
        return offline || Response.error();
      })
    );
    return;
  }

  if (url.pathname === "/manifest.webmanifest" || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => {
        const copy = response.clone();
        void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      }))
    );
  }
});
`;

  const firebase = configured
    ? String.raw`
try {
  importScripts("https://www.gstatic.com/firebasejs/12.17.0/firebase-app-compat.js");
  importScripts("https://www.gstatic.com/firebasejs/12.17.0/firebase-messaging-compat.js");
  firebase.initializeApp(${JSON.stringify(config)});
  firebase.messaging();
} catch (error) {
  console.warn("PlantVerse push messaging could not initialize.", error);
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const requested = event.notification?.data?.FCM_MSG?.fcmOptions?.link || event.notification?.data?.href || "/notifications";
  const target = new URL(requested, self.location.origin);
  if (target.origin !== self.location.origin) return;
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
    for (const client of windows) {
      if ("focus" in client && client.url === target.href) return client.focus();
    }
    return clients.openWindow ? clients.openWindow(target.href) : undefined;
  }));
});
`
    : "\n/* Firebase browser configuration is incomplete; offline/PWA support remains available. */\n";

  return new NextResponse(`${shell}${firebase}`, {
    headers: {
      "content-type": "application/javascript; charset=utf-8",
      "cache-control": "no-cache, no-store, must-revalidate",
      "service-worker-allowed": "/",
      "x-content-type-options": "nosniff",
    },
  });
}
