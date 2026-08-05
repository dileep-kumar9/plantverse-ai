import type { NextRequest } from "next/server";

import { getSessionUser, type SessionUser } from "@/lib/auth/session";

export async function requireUser(request?: NextRequest): Promise<SessionUser> {
  const user = await getSessionUser(request);
  if (!user) {
    throw Object.assign(new Error("Authentication required."), { status: 401 });
  }
  return user;
}

export async function requireAdmin(request?: NextRequest): Promise<SessionUser> {
  const user = await requireUser(request);
  if (user.role !== "admin") {
    throw Object.assign(new Error("Administrator access required."), { status: 403 });
  }
  return user;
}
