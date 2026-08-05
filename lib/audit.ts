import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";

import { getAdminDb } from "@/lib/firebase/admin";
import { getClientIp } from "@/lib/security";

export type AuditActor = {
  id?: string | null;
  email?: string | null;
  role?: string | null;
};

export type AuditInput = {
  action: string;
  resourceType: string;
  resourceId?: string | null;
  actor?: AuditActor;
  request?: NextRequest;
  outcome?: "success" | "failure";
  metadata?: Record<string, unknown>;
};

function safeMetadata(value: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!value) return {};
  const blocked = new Set(["password", "token", "authorization", "cookie", "secret"]);
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !blocked.has(key.toLowerCase()))
      .slice(0, 50),
  );
}

export async function writeAuditLog(input: AuditInput): Promise<string> {
  const id = randomUUID();
  const now = new Date().toISOString();
  const request = input.request;
  const record = {
    id,
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId ?? null,
    actorId: input.actor?.id ?? null,
    actorEmail: input.actor?.email ?? null,
    actorRole: input.actor?.role ?? null,
    outcome: input.outcome ?? "success",
    ip: request ? getClientIp(request) : null,
    userAgent: request?.headers.get("user-agent")?.slice(0, 500) ?? null,
    requestId:
      request?.headers.get("x-vercel-id") ??
      request?.headers.get("x-request-id") ??
      null,
    metadata: safeMetadata(input.metadata),
    createdAt: now,
  };

  await getAdminDb().collection("auditLogs").doc(id).set(record);
  return id;
}
