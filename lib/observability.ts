import { randomUUID } from "node:crypto";

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogContext = Record<string, unknown> & {
  requestId?: string;
  userId?: string;
  route?: string;
};

function sanitize(value: unknown): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === "object") {
    const blocked = new Set([
      "password",
      "token",
      "idToken",
      "refreshToken",
      "authorization",
      "cookie",
      "privateKey",
      "secret",
    ]);
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => !blocked.has(key))
        .map(([key, item]) => [key, sanitize(item)]),
    );
  }
  return value;
}

export function log(
  level: LogLevel,
  message: string,
  context: LogContext = {},
): void {
  const sanitizedContext = sanitize(context);
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    service: "plantverse-web",
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
    message,
    ...(sanitizedContext && typeof sanitizedContext === "object"
      ? (sanitizedContext as Record<string, unknown>)
      : {}),
  };

  const encoded = JSON.stringify(payload);
  if (level === "error") console.error(encoded);
  else if (level === "warn") console.warn(encoded);
  else console.log(encoded);
}

function parseSentryDsn(dsn: string): {
  endpoint: string;
  publicKey: string;
  projectId: string;
} | null {
  try {
    const parsed = new URL(dsn);
    const projectId = parsed.pathname.replace(/^\//, "").split("/").at(-1);
    if (!parsed.username || !projectId) return null;
    return {
      endpoint: `${parsed.protocol}//${parsed.host}/api/${projectId}/envelope/`,
      publicKey: parsed.username,
      projectId,
    };
  } catch {
    return null;
  }
}

export async function captureException(
  error: unknown,
  context: LogContext = {},
): Promise<void> {
  const normalized =
    error instanceof Error ? error : new Error(String(error ?? "Unknown error"));
  log("error", normalized.message, { ...context, error: normalized });

  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  const parsed = parseSentryDsn(dsn);
  if (!parsed) return;

  const eventId = randomUUID().replaceAll("-", "");
  const timestamp = Date.now() / 1000;
  const envelopeHeader = {
    event_id: eventId,
    sent_at: new Date().toISOString(),
    dsn,
  };
  const itemHeader = { type: "event", content_type: "application/json" };
  const event = {
    event_id: eventId,
    timestamp,
    platform: "javascript",
    level: "error",
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
    release: process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.npm_package_version,
    server_name: "plantverse-web",
    exception: {
      values: [
        {
          type: normalized.name,
          value: normalized.message,
          stacktrace: normalized.stack
            ? {
                frames: normalized.stack
                  .split("\n")
                  .slice(1, 40)
                  .reverse()
                  .map((line) => ({ filename: line.trim(), function: "unknown" })),
              }
            : undefined,
        },
      ],
    },
    extra: sanitize(context),
    tags: {
      service: "plantverse-web",
      project: parsed.projectId,
    },
  };

  const body = `${JSON.stringify(envelopeHeader)}\n${JSON.stringify(itemHeader)}\n${JSON.stringify(event)}`;

  try {
    await fetch(parsed.endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/x-sentry-envelope",
        "x-sentry-auth": `Sentry sentry_version=7,sentry_key=${parsed.publicKey},sentry_client=plantverse/5.0.0`,
      },
      body,
      cache: "no-store",
    });
  } catch {
    // Observability must never break the user request.
  }
}
