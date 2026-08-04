import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import {
  SESSION_COOKIE_NAME,
  SESSION_DURATION_MS,
} from "@/lib/auth/session";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SessionRequestBody = {
  idToken?: unknown;
};

function json(
  body: Record<string, unknown>,
  status = 200,
): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function isAllowedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");

  if (!origin) {
    return process.env.NODE_ENV !== "production";
  }

  const allowedOrigins = new Set<string>([
    request.nextUrl.origin,
  ]);

  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (configuredAppUrl) {
    try {
      allowedOrigins.add(new URL(configuredAppUrl).origin);
    } catch {
      // Invalid configured URL is ignored.
    }
  }

  return allowedOrigins.has(origin);
}

function setSessionCookie(
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
  });
}

function clearSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse> {
  if (!isAllowedOrigin(request)) {
    return json(
      {
        error: "Request origin is not allowed.",
      },
      403,
    );
  }

  let body: SessionRequestBody;

  try {
    body = (await request.json()) as SessionRequestBody;
  } catch {
    return json(
      {
        error: "Invalid request body.",
      },
      400,
    );
  }

  if (
    typeof body.idToken !== "string" ||
    body.idToken.length < 20
  ) {
    return json(
      {
        error: "A valid Firebase ID token is required.",
      },
      400,
    );
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(
      body.idToken,
      true,
    );

    const currentTimeSeconds = Math.floor(Date.now() / 1000);
    const signedInRecently =
      currentTimeSeconds - decodedToken.auth_time <= 5 * 60;

    if (!signedInRecently) {
      return json(
        {
          error:
            "Your sign-in is no longer recent. Please sign in again.",
        },
        401,
      );
    }

    if (!decodedToken.email_verified) {
      return json(
        {
          error:
            "Verify your email address before continuing.",
        },
        403,
      );
    }

    const sessionCookie =
      await adminAuth.createSessionCookie(body.idToken, {
        expiresIn: SESSION_DURATION_MS,
      });

    const userRecord = await adminAuth.getUser(
      decodedToken.uid,
    );

    await adminDb
      .collection("users")
      .doc(decodedToken.uid)
      .set(
        {
          uid: decodedToken.uid,
          email: userRecord.email ?? null,
          emailVerified: userRecord.emailVerified,
          displayName: userRecord.displayName ?? null,
          photoURL: userRecord.photoURL ?? null,
          phoneNumber: userRecord.phoneNumber ?? null,
          providers: userRecord.providerData.map(
            (provider) => provider.providerId,
          ),
          disabled: userRecord.disabled,
          authCreatedAt:
            userRecord.metadata.creationTime ?? null,
          lastLoginAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        {
          merge: true,
        },
      );

    const response = json({
      success: true,
      user: {
        uid: userRecord.uid,
        email: userRecord.email ?? null,
        emailVerified: userRecord.emailVerified,
        displayName: userRecord.displayName ?? null,
        photoURL: userRecord.photoURL ?? null,
      },
    });

    setSessionCookie(response, sessionCookie);

    return response;
  } catch (error) {
    console.error("Session creation failed:", error);

    return json(
      {
        error:
          "Unable to create your session. Please sign in again.",
      },
      401,
    );
  }
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse> {
  const sessionCookie =
    request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return json(
      {
        authenticated: false,
        user: null,
      },
      401,
    );
  }

  try {
    const decodedToken =
      await adminAuth.verifySessionCookie(
        sessionCookie,
        true,
      );

    const [userRecord, profileSnapshot] =
      await Promise.all([
        adminAuth.getUser(decodedToken.uid),
        adminDb
          .collection("users")
          .doc(decodedToken.uid)
          .get(),
      ]);

    const profile = profileSnapshot.exists
      ? profileSnapshot.data()
      : null;

    return json({
      authenticated: true,
      user: {
        uid: userRecord.uid,
        email: userRecord.email ?? null,
        emailVerified: userRecord.emailVerified,
        displayName:
          profile?.displayName ??
          userRecord.displayName ??
          null,
        photoURL:
          profile?.photoURL ??
          userRecord.photoURL ??
          null,
        role: profile?.role ?? "user",
      },
    });
  } catch {
    const response = json(
      {
        authenticated: false,
        user: null,
      },
      401,
    );

    clearSessionCookie(response);

    return response;
  }
}

export async function DELETE(
  request: NextRequest,
): Promise<NextResponse> {
  if (!isAllowedOrigin(request)) {
    return json(
      {
        error: "Request origin is not allowed.",
      },
      403,
    );
  }

  const response = json({
    success: true,
  });

  clearSessionCookie(response);

  return response;
}