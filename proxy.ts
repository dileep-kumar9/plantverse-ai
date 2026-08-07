import { NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

const PUBLIC_ROUTES = [
  "/",
  "/offline",
  "/robots.txt",
  "/sitemap.xml",
  "/login",
  "/signup",
  "/forgot-password",
  "/verify-email",
  "/auth",
  "/privacy",
  "/terms",
  "/cookies",
  "/shipping",
  "/refunds",
  "/safety",
  "/api/auth",
  "/api/health",
  "/api/products",
  "/api/stripe/webhook",
  "/api/shiprocket/webhook",
  "/api/devices/vendor",
  "/api/cron",
  "/firebase-messaging-sw.js",
];

function isPublic(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function isAuthenticationPage(pathname: string): boolean {
  return ["/login", "/signup", "/forgot-password", "/verify-email", "/auth"].some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (pathname === "/" && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isAuthenticationPage(pathname) && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!isPublic(pathname) && !hasSession) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    const url = new URL("/login", request.url);
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2)$).*)",
  ],
};
