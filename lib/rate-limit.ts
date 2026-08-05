import type { NextRequest } from "next/server";

import { FieldValue, runTransactionWithRetry } from "@/lib/firebase-admin-rest";
import { getClientIp } from "@/lib/security";

type Bucket = { count: number; resetAt: number };
type RemoteResult = { count: number; resetAt: number };

const memoryBuckets = new Map<string, Bucket>();

function upstashConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );
}

async function upstashIncrement(
  key: string,
  windowSeconds: number,
): Promise<RemoteResult | null> {
  const baseUrl = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, "");
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!baseUrl || !token) return null;

  try {
    const response = await fetch(`${baseUrl}/pipeline`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, windowSeconds, "NX"],
        ["TTL", key],
      ]),
      cache: "no-store",
      signal: AbortSignal.timeout(2_500),
    });
    if (!response.ok) return null;
    const result = (await response.json()) as Array<{ result?: number }>;
    const count = Number(result[0]?.result ?? 0);
    const ttl = Math.max(0, Number(result[2]?.result ?? windowSeconds));
    return { count, resetAt: Date.now() + ttl * 1000 };
  } catch {
    return null;
  }
}

function memoryIncrement(key: string, windowSeconds: number): RemoteResult {
  const now = Date.now();
  const current = memoryBuckets.get(key);
  if (!current || current.resetAt <= now) {
    const bucket = { count: 1, resetAt: now + windowSeconds * 1000 };
    memoryBuckets.set(key, bucket);
    return bucket;
  }
  current.count += 1;
  if (memoryBuckets.size > 10_000) {
    for (const [bucketKey, bucket] of memoryBuckets) {
      if (bucket.resetAt <= now) memoryBuckets.delete(bucketKey);
    }
  }
  return current;
}

export async function enforceRateLimit(
  request: NextRequest,
  namespace: string,
  limit: number,
  windowSeconds: number,
  identity?: string,
): Promise<{ remaining: number; resetAt: number }> {
  const key = `pv:${namespace}:${identity ?? getClientIp(request)}`;
  const remote = await upstashIncrement(key, windowSeconds);

  if (
    !remote &&
    process.env.NODE_ENV === "production" &&
    process.env.REQUIRE_DISTRIBUTED_RATE_LIMIT === "true"
  ) {
    throw Object.assign(
      new Error("Rate limiting service is temporarily unavailable."),
      { status: 503 },
    );
  }

  const result = remote ?? memoryIncrement(key, windowSeconds);
  if (result.count > limit) {
    throw Object.assign(
      new Error("Too many requests. Please wait and try again."),
      { status: 429, resetAt: result.resetAt },
    );
  }

  return {
    remaining: Math.max(0, limit - result.count),
    resetAt: result.resetAt,
  };
}

export type QuotaFeature =
  | "image_analysis"
  | "video_analysis"
  | "assistant"
  | "translation"
  | "remote_import";

const defaultDailyLimits: Record<QuotaFeature, number> = {
  image_analysis: 20,
  video_analysis: 5,
  assistant: 60,
  translation: 80,
  remote_import: 20,
};

function configuredLimit(feature: QuotaFeature): number {
  const name = `AI_DAILY_QUOTA_${feature.toUpperCase()}`;
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) && parsed > 0
    ? Math.floor(parsed)
    : defaultDailyLimits[feature];
}

export async function consumeDailyQuota(
  userId: string,
  feature: QuotaFeature,
  amount = 1,
): Promise<{ used: number; limit: number; remaining: number }> {
  const safeAmount = Math.max(1, Math.min(100, Math.floor(amount)));
  const day = new Date().toISOString().slice(0, 10);
  const limit = configuredLimit(feature);
  const documentId = `${userId}_${day}`;

  return runTransactionWithRetry(async (transaction, db) => {
    const ref = db.collection("usageDaily").doc(documentId);
    const snapshot = await transaction.get(ref);
    const current = Number(snapshot.data()?.[feature] ?? 0);
    const next = current + safeAmount;
    if (next > limit) {
      throw Object.assign(
        new Error(`Daily ${feature.replaceAll("_", " ")} quota reached.`),
        { status: 429, code: "DAILY_QUOTA_EXCEEDED", limit, used: current },
      );
    }
    transaction.set(
      ref,
      {
        userId,
        day,
        [feature]: next,
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: snapshot.exists
          ? snapshot.data()?.createdAt ?? FieldValue.serverTimestamp()
          : FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    return { used: next, limit, remaining: Math.max(0, limit - next) };
  });
}

export function rateLimitHealth(): {
  configured: boolean;
  required: boolean;
} {
  return {
    configured: upstashConfigured(),
    required: process.env.REQUIRE_DISTRIBUTED_RATE_LIMIT === "true",
  };
}
