import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { PRIVACY_VERSION, TERMS_VERSION } from "@/lib/legal";
import { enforceRateLimit } from "@/lib/rate-limit";
import { assertSameOrigin } from "@/lib/security";

export const runtime = "nodejs";

type ConsentBody = {
  idToken?: unknown;
  acceptedLegal?: unknown;
};

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    await enforceRateLimit(request, "auth-consent", 10, 60 * 60);
    const body = (await request.json()) as ConsentBody;
    if (body.acceptedLegal !== true) {
      return NextResponse.json({ error: "Legal consent is required." }, { status: 400 });
    }
    if (typeof body.idToken !== "string" || body.idToken.length < 20) {
      return NextResponse.json({ error: "A valid Firebase ID token is required." }, { status: 400 });
    }

    const decoded = await getAdminAuth().verifyIdToken(body.idToken, true);
    const email = decoded.email?.trim().toLowerCase() ?? null;
    const acceptedAt = new Date().toISOString();
    await getAdminDb().collection("users").doc(decoded.uid).set(
      {
        uid: decoded.uid,
        email,
        displayName:
          typeof decoded.name === "string" && decoded.name.trim()
            ? decoded.name.trim()
            : email?.split("@")[0] ?? "PlantVerse user",
        legalConsent: {
          acceptedAt,
          termsVersion: TERMS_VERSION,
          privacyVersion: PRIVACY_VERSION,
          source: "signup",
          providerIds: decoded.firebase?.sign_in_provider
            ? [decoded.firebase.sign_in_provider]
            : [],
        },
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    void writeAuditLog({
      action: "legal.consent.accepted",
      resourceType: "user",
      resourceId: decoded.uid,
      actor: { id: decoded.uid, email },
      request,
      metadata: { termsVersion: TERMS_VERSION, privacyVersion: PRIVACY_VERSION },
    }).catch(() => undefined);

    return NextResponse.json({ success: true, acceptedAt });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to record consent.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
