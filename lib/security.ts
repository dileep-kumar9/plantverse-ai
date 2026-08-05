import { NextRequest } from "next/server";

export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function assertSameOrigin(request: NextRequest): void {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const expected = new URL(request.url).origin;
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (origin !== expected && origin !== configured) {
    throw new Error("Cross-origin request rejected.");
  }
}

export function normalizeEmail(value: unknown): string {
  const email = String(value ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new Error("Enter a valid email address.");
  }
  return email;
}

export function requireStrongPassword(value: unknown): string {
  const password = String(value ?? "");
  if (password.length < 8 || password.length > 128) {
    throw new Error("Password must contain between 8 and 128 characters.");
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new Error("Password must contain at least one letter and one number.");
  }
  return password;
}

export function cleanText(value: unknown, maximum: number): string {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maximum);
}

export function validateJsonSize(value: unknown, maximumBytes = 100_000): void {
  const encoded = new TextEncoder().encode(JSON.stringify(value));
  if (encoded.byteLength > maximumBytes) {
    throw new Error("The submitted data is too large.");
  }
}
