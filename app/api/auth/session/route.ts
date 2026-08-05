import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import {
  clearSessionCookie,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_MS,
  sessionRoleForEmail,
  setSessionCookie,
} from "@/lib/auth/session";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { PRIVACY_VERSION, TERMS_VERSION } from "@/lib/legal";
import { captureException } from "@/lib/observability";
import { enforceRateLimit } from "@/lib/rate-limit";
import { assertSameOrigin } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SessionBody = {
  idToken?: unknown;
  acceptedLegal?: unknown;
};

function json(body: Record<string, unknown>, status = 200): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    assertSameOrigin(request);
    await enforceRateLimit(request, "auth-session-create", 20, 15 * 60);

    let body: SessionBody;
    try {
      body = (await request.json()) as SessionBody;
    } catch {
      return json({ error: "Invalid request body." }, 400);
    }

    if (typeof body.idToken !== "string" || body.idToken.length < 20) {
      return json({ error: "A valid Firebase ID token is required." }, 400);
    }

    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(body.idToken, true);
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (!decoded.auth_time || nowSeconds - decoded.auth_time > 5 * 60) {
      return json(
        { error: "Your sign-in is no longer recent. Please sign in again.", code: "RECENT_LOGIN_REQUIRED" },
        401,
      );
    }

    if (decoded.email_verified !== true) {
      return json(
        { error: "Verify your email address before continuing.", code: "EMAIL_NOT_VERIFIED" },
        403,
      );
    }

    const userRecord = await auth.getUser(decoded.uid);
    const email = userRecord.email?.trim().toLowerCase();
    if (!email) return json({ error: "The account does not have a usable email address." }, 400);

    const db = getAdminDb();
    const userRef = db.collection("users").doc(decoded.uid);
    const profileSnapshot = await userRef.get();
    const profile = profileSnapshot.data() ?? {};
    const existingConsent = profile.legalConsent as
      | { acceptedAt?: unknown; termsVersion?: unknown; privacyVersion?: unknown }
      | undefined;

    if (!existingConsent?.acceptedAt && body.acceptedLegal !== true) {
      return json(
        {
          error: "Accept the Terms and Privacy Policy before continuing.",
          code: "CONSENT_REQUIRED",
          termsVersion: TERMS_VERSION,
          privacyVersion: PRIVACY_VERSION,
        },
        409,
      );
    }

    const role = sessionRoleForEmail(email);
    const legalConsent =
      existingConsent?.acceptedAt
        ? existingConsent
        : {
            acceptedAt: new Date().toISOString(),
            termsVersion: TERMS_VERSION,
            privacyVersion: PRIVACY_VERSION,
            source: "session",
            providerIds: userRecord.providerData.map((item) => item.providerId),
          };

    await userRef.set(
      {
        uid: decoded.uid,
        email,
        emailVerified: userRecord.emailVerified,
        displayName: userRecord.displayName ?? profile.displayName ?? email.split("@")[0],
        photoURL: userRecord.photoURL ?? profile.photoURL ?? null,
        phoneNumber: userRecord.phoneNumber ?? profile.phoneNumber ?? null,
        providers: userRecord.providerData.map((item) => item.providerId),
        role,
        disabled: userRecord.disabled,
        legalConsent,
        authCreatedAt: userRecord.metadata.creationTime ?? null,
        lastLoginAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    const sessionCookie = await auth.createSessionCookie(body.idToken, {
      expiresIn: SESSION_DURATION_MS,
    });

    const response = json({
      success: true,
      user: {
        id: decoded.uid,
        email,
        name: userRecord.displayName ?? profile.displayName ?? email.split("@")[0],
        photoURL: userRecord.photoURL ?? profile.photoURL ?? null,
        role,
        emailVerified: true,
      },
    });
    setSessionCookie(response, sessionCookie);

    void writeAuditLog({
      action: "auth.session.created",
      resourceType: "user",
      resourceId: decoded.uid,
      actor: { id: decoded.uid, email, role },
      request,
      metadata: { providers: userRecord.providerData.map((item) => item.providerId) },
    }).catch(() => undefined);

    return response;
  } catch (error) {
    await captureException(error, { route: "/api/auth/session", operation: "POST" });
    return json({ error: "Unable to create your session. Please sign in again." }, 401);
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!cookie) return json({ authenticated: false, user: null }, 401);

  try {
    const decoded = await getAdminAuth().verifySessionCookie(cookie, true);
    const email = decoded.email?.trim().toLowerCase();
    if (!email) throw new Error("Session email is missing.");

    const profileSnapshot = await getAdminDb().collection("users").doc(decoded.uid).get();
    const profile = profileSnapshot.data() ?? {};
    const role = sessionRoleForEmail(email);

    return json({
      authenticated: true,
      user: {
        id: decoded.uid,
        email,
        name:
          (typeof profile.displayName === "string" && profile.displayName.trim()) ||
          (typeof decoded.name === "string" && decoded.name.trim()) ||
          email.split("@")[0],
        photoURL: typeof profile.photoURL === "string" ? profile.photoURL : null,
        role,
        emailVerified: decoded.email_verified === true,
      },
    });
  } catch {
    const response = json({ authenticated: false, user: null }, 401);
    clearSessionCookie(response);
    return response;
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    assertSameOrigin(request);
  } catch {
    return json({ error: "Request origin is not allowed." }, 403);
  }

  const response = json({ success: true });
  clearSessionCookie(response);
  return response;
}
