import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

import { getAdminAuth } from "@/lib/firebase/admin";

export const SESSION_COOKIE_NAME = "plantverse_session";
export const SESSION_DURATION_MS = 5 * 24 * 60 * 60 * 1000;

export type SessionUser = {
  sub: string;
  email: string;
  name: string;
  role: "user" | "admin";
  emailVerified: boolean;
  authTime?: number;
};

export function sessionRoleForEmail(email: string): SessionUser["role"] {
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase()) ? "admin" : "user";
}

export async function verifySessionCookie(
  token?: string | null,
): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const decoded = await getAdminAuth().verifySessionCookie(token, true);
    const email = decoded.email?.trim().toLowerCase();
    if (!email) return null;
    return {
      sub: decoded.uid,
      email,
      name:
        typeof decoded.name === "string" && decoded.name.trim()
          ? decoded.name.trim()
          : email.split("@")[0],
      role: sessionRoleForEmail(email),
      emailVerified: decoded.email_verified === true,
      authTime: decoded.auth_time,
    };
  } catch {
    return null;
  }
}

export async function getSessionUser(
  request?: NextRequest,
): Promise<SessionUser | null> {
  const token = request
    ? request.cookies.get(SESSION_COOKIE_NAME)?.value
    : (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  return verifySessionCookie(token);
}

export function setSessionCookie(
  response: NextResponse,
  value: string,
): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_DURATION_MS / 1000),
    priority: "high",
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
    priority: "high",
  });
}
