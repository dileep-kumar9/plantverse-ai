import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const strict = process.env.EXTERNAL_ACCEPTANCE_STRICT === "true";
const results: Array<{
  service: string;
  status: "pass" | "fail" | "skip";
  detail: string;
}> = [];

function record(
  service: string,
  status: "pass" | "fail" | "skip",
  detail: string,
): void {
  results.push({ service, status, detail });
  console.log(`${status.toUpperCase()} ${service}: ${detail}`);
}

function configured(service: string, values: Array<string | undefined>, detail: string): void {
  record(service, values.every((value) => Boolean(value?.trim())) ? "pass" : "skip", detail);
}

async function firebase(): Promise<void> {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    record("Firebase", "skip", "Admin credentials are missing.");
    return;
  }
  try {
    const app =
      getApps()[0] ||
      initializeApp({
        projectId,
        credential: cert({ projectId, clientEmail, privateKey }),
      });
    await getFirestore(app).collection("serviceHealth").doc("acceptance").get();
    await getAuth(app).listUsers(1);
    record("Firebase", "pass", "Firestore and Authentication Admin API succeeded.");
  } catch (error) {
    record(
      "Firebase",
      "fail",
      error instanceof Error ? error.message : "Request failed.",
    );
  }
}

async function upstash(): Promise<void> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, "");
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    record("Upstash", "skip", "REST credentials are missing.");
    return;
  }
  try {
    const response = await fetch(`${url}/ping`, {
      headers: { authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10_000),
    });
    record(
      "Upstash",
      response.ok ? "pass" : "fail",
      response.ok ? "PING succeeded." : `HTTP ${response.status}`,
    );
  } catch (error) {
    record(
      "Upstash",
      "fail",
      error instanceof Error ? error.message : "Request failed.",
    );
  }
}

async function stripe(): Promise<void> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    record("Stripe", "skip", "Secret key is missing.");
    return;
  }
  try {
    const response = await fetch("https://api.stripe.com/v1/account", {
      headers: { authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(15_000),
    });
    record(
      "Stripe",
      response.ok ? "pass" : "fail",
      response.ok ? "Account API succeeded." : `HTTP ${response.status}`,
    );
  } catch (error) {
    record(
      "Stripe",
      "fail",
      error instanceof Error ? error.message : "Request failed.",
    );
  }
}

async function shiprocket(): Promise<void> {
  let token = process.env.SHIPROCKET_TOKEN?.trim();
  try {
    if (!token) {
      const email = process.env.SHIPROCKET_EMAIL;
      const password = process.env.SHIPROCKET_PASSWORD;
      if (!email || !password) {
        record("Shiprocket", "skip", "API credentials are missing.");
        return;
      }
      const login = await fetch(
        "https://apiv2.shiprocket.in/v1/external/auth/login",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password }),
          signal: AbortSignal.timeout(15_000),
        },
      );
      const payload = (await login.json().catch(() => ({}))) as { token?: string };
      if (!login.ok || !payload.token) {
        record("Shiprocket", "fail", `Authentication failed (HTTP ${login.status}).`);
        return;
      }
      token = payload.token;
    }

    const response = await fetch(
      "https://apiv2.shiprocket.in/v1/external/account/details/statement?per_page=1",
      {
        headers: { authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(15_000),
      },
    );
    record(
      "Shiprocket",
      response.ok ? "pass" : "fail",
      response.ok
        ? "Authenticated account statement request succeeded."
        : `Authenticated request failed (HTTP ${response.status}).`,
    );
  } catch (error) {
    record(
      "Shiprocket",
      "fail",
      error instanceof Error ? error.message : "Request failed.",
    );
  }
}

async function gemini(): Promise<void> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    record("Gemini", "skip", "API key is missing.");
    return;
  }
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`,
      { signal: AbortSignal.timeout(15_000) },
    );
    record(
      "Gemini",
      response.ok ? "pass" : "fail",
      response.ok ? "Model-list request succeeded." : `HTTP ${response.status}`,
    );
  } catch (error) {
    record(
      "Gemini",
      "fail",
      error instanceof Error ? error.message : "Request failed.",
    );
  }
}

await Promise.all([firebase(), upstash(), stripe(), shiprocket(), gemini()]);

configured(
  "FCM web push",
  [
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
  ],
  "Messaging sender ID and browser VAPID key must both be configured.",
);
configured(
  "Stripe webhook",
  [process.env.STRIPE_WEBHOOK_SECRET],
  "Signed Stripe webhook secret must be configured.",
);
configured(
  "Shiprocket webhook",
  [process.env.SHIPROCKET_WEBHOOK_SECRET],
  "A trusted gateway/header webhook secret must be configured.",
);
configured(
  "Firestore backups",
  [process.env.FIRESTORE_BACKUP_BUCKET],
  "A backup bucket must be configured and separately tested from the admin console.",
);
configured(
  "Monitoring",
  [process.env.SENTRY_DSN],
  "Sentry DSN must be configured and verified with the admin monitoring test.",
);
configured(
  "Analytics",
  [process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID],
  "Google Analytics measurement ID must be configured; collection remains consent-gated.",
);
configured(
  "Legal operator",
  [
    process.env.LEGAL_OPERATOR_NAME,
    process.env.LEGAL_REGISTERED_ADDRESS,
    process.env.LEGAL_CITY,
    process.env.LEGAL_STATE,
    process.env.LEGAL_POSTAL_CODE,
    process.env.LEGAL_COUNTRY,
    process.env.LEGAL_SUPPORT_EMAIL,
    process.env.LEGAL_PRIVACY_EMAIL,
    process.env.LEGAL_SUPPORT_PHONE,
    process.env.LEGAL_JURISDICTION,
  ],
  "All mandatory public legal operator values must be configured.",
);

const skipped = results.filter((item) => item.status === "skip").length;
const failed = results.filter((item) => item.status === "fail").length;
console.log(JSON.stringify({ strict, failed, skipped, results }, null, 2));
if (failed > 0 || (strict && skipped > 0)) process.exitCode = 1;
