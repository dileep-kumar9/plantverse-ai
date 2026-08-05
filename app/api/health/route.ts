import { NextResponse } from "next/server";

import { missingLegalEnvironmentVariables } from "@/lib/legal";
import { rateLimitHealth } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const required = [
    "FIREBASE_PROJECT_ID",
    "FIREBASE_CLIENT_EMAIL",
    "FIREBASE_PRIVATE_KEY",
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID",
    "GEMINI_API_KEY",
  ];
  const missing = required.filter((name) => !process.env[name]?.trim());
  const legalMissing = missingLegalEnvironmentVariables();
  const rateLimit = rateLimitHealth();
  const commerceEnabled = process.env.ENABLE_COMMERCE === "true";
  const commerceConfigured = Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_WEBHOOK_SECRET &&
      (process.env.SHIPROCKET_TOKEN ||
        (process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD)),
  );
  const degraded =
    missing.length > 0 ||
    legalMissing.length > 0 ||
    (rateLimit.required && !rateLimit.configured) ||
    (commerceEnabled && !commerceConfigured);

  return NextResponse.json(
    {
      status: degraded ? "degraded" : "ok",
      version:
        process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
        process.env.npm_package_version ||
        "5.0.0",
      timestamp: new Date().toISOString(),
      checks: {
        coreEnvironment: missing.length === 0,
        legalConfiguration: legalMissing.length === 0,
        distributedRateLimit: rateLimit.configured,
        commerce: commerceEnabled ? commerceConfigured : "disabled",
        pushNotifications: Boolean(process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY),
        backups: Boolean(process.env.FIRESTORE_BACKUP_BUCKET),
        monitoring: Boolean(process.env.SENTRY_DSN),
        analytics: Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID),
      },
    },
    {
      status: degraded ? 503 : 200,
      headers: { "cache-control": "no-store" },
    },
  );
}
