import { NextRequest, NextResponse } from "next/server";

import { testShiprocketConnection, shiprocketConfigured } from "@/lib/commerce/shiprocket";
import { stripeConfigured } from "@/lib/commerce/stripe";
import { getAdminDb } from "@/lib/firebase/admin";
import { missingLegalEnvironmentVariables } from "@/lib/legal";
import { rateLimitHealth } from "@/lib/rate-limit";
import { requireAdmin } from "@/lib/server/require-user";

export const runtime = "nodejs";

type Check = {
  name: string;
  configured: boolean;
  ok: boolean;
  detail: string;
};

async function firebaseCheck(): Promise<Check> {
  try {
    await getAdminDb().collection("serviceHealth").doc("readiness").get();
    return { name: "Firebase/Firestore", configured: true, ok: true, detail: "Firestore connection succeeded." };
  } catch (error) {
    return { name: "Firebase/Firestore", configured: true, ok: false, detail: error instanceof Error ? error.message : "Connection failed." };
  }
}

async function upstashCheck(): Promise<Check> {
  const configured = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  if (!configured) return { name: "Upstash", configured: false, ok: false, detail: "Credentials are not configured." };
  try {
    const response = await fetch(`${process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, "")}/ping`, {
      headers: { authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    return { name: "Upstash", configured: true, ok: response.ok, detail: response.ok ? "PING succeeded." : `HTTP ${response.status}` };
  } catch (error) {
    return { name: "Upstash", configured: true, ok: false, detail: error instanceof Error ? error.message : "Connection failed." };
  }
}

async function stripeCheck(): Promise<Check> {
  const configured = stripeConfigured();
  if (!configured) return { name: "Stripe", configured: false, ok: false, detail: "Stripe credentials are not configured." };
  try {
    const response = await fetch("https://api.stripe.com/v1/account", {
      headers: { authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    return { name: "Stripe", configured: true, ok: response.ok, detail: response.ok ? "Account API succeeded." : `HTTP ${response.status}` };
  } catch (error) {
    return { name: "Stripe", configured: true, ok: false, detail: error instanceof Error ? error.message : "Connection failed." };
  }
}

async function shiprocketCheck(): Promise<Check> {
  const configured = shiprocketConfigured();
  if (!configured) return { name: "Shiprocket", configured: false, ok: false, detail: "Shiprocket credentials are not configured." };
  try {
    await testShiprocketConnection();
    return { name: "Shiprocket", configured: true, ok: true, detail: "Authentication succeeded." };
  } catch (error) {
    return { name: "Shiprocket", configured: true, ok: false, detail: error instanceof Error ? error.message : "Connection failed." };
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await requireAdmin(request);
    const rateLimit = rateLimitHealth();
    const [firebase, upstash, stripe, shiprocket] = await Promise.all([
      firebaseCheck(),
      upstashCheck(),
      stripeCheck(),
      shiprocketCheck(),
    ]);
    const checks: Check[] = [
      firebase,
      upstash,
      stripe,
      shiprocket,
      {
        name: "Firebase Cloud Messaging",
        configured: Boolean(process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY),
        ok: Boolean(process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY),
        detail: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ? "VAPID key is configured." : "VAPID key is missing.",
      },
      {
        name: "Firestore backups",
        configured: Boolean(process.env.FIRESTORE_BACKUP_BUCKET),
        ok: Boolean(process.env.FIRESTORE_BACKUP_BUCKET),
        detail: process.env.FIRESTORE_BACKUP_BUCKET ? "Backup bucket is configured." : "Backup bucket is missing.",
      },
      {
        name: "Legal operator",
        configured: missingLegalEnvironmentVariables().length === 0,
        ok: missingLegalEnvironmentVariables().length === 0,
        detail: missingLegalEnvironmentVariables().length === 0 ? "Required legal fields are configured." : `Missing: ${missingLegalEnvironmentVariables().join(", ")}`,
      },
      {
        name: "Distributed rate limiting",
        configured: rateLimit.configured,
        ok: rateLimit.configured || !rateLimit.required,
        detail: rateLimit.configured ? "Upstash is configured." : rateLimit.required ? "Required but unavailable." : "Optional fallback is active.",
      },
      {
        name: "Monitoring",
        configured: Boolean(process.env.SENTRY_DSN),
        ok: Boolean(process.env.SENTRY_DSN),
        detail: process.env.SENTRY_DSN ? "Sentry-compatible ingestion is configured; send an admin acceptance event to verify delivery." : "SENTRY_DSN is missing.",
      },
      {
        name: "Consent-gated analytics",
        configured: Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID),
        ok: Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID),
        detail: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ? "Google Analytics is configured and remains disabled until user consent." : "NEXT_PUBLIC_GA_MEASUREMENT_ID is missing.",
      },
      {
        name: "Scheduled backups",
        configured: Boolean(process.env.FIRESTORE_BACKUP_BUCKET),
        ok: Boolean(process.env.FIRESTORE_BACKUP_BUCKET) && process.env.ENABLE_SCHEDULED_BACKUPS === "true",
        detail: !process.env.FIRESTORE_BACKUP_BUCKET ? "Backup bucket is missing." : process.env.ENABLE_SCHEDULED_BACKUPS === "true" ? "Daily scheduled export is enabled." : "Bucket is configured, but ENABLE_SCHEDULED_BACKUPS is not true.",
      },
      {
        name: "Device vendor gateway",
        configured: Boolean(process.env.DEVICE_VENDOR_WEBHOOK_SECRET),
        ok: Boolean(process.env.DEVICE_VENDOR_WEBHOOK_SECRET),
        detail: process.env.DEVICE_VENDOR_WEBHOOK_SECRET ? "Signed vendor gateway ingestion is configured." : "DEVICE_VENDOR_WEBHOOK_SECRET is missing.",
      },
    ];
    return NextResponse.json({
      checkedAt: new Date().toISOString(),
      ready: checks.every((check) => check.ok),
      checks,
    });
  } catch (error) {
    const status = Number((error as { status?: number }).status ?? 500);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Health checks failed." }, { status });
  }
}
