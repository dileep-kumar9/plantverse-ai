import { FieldValue } from "firebase-admin/firestore";

import { getFirebaseAdminApp, getAdminDb } from "@/lib/firebase/admin";

function backupBucket(): string {
  const value = process.env.FIRESTORE_BACKUP_BUCKET?.trim().replace(/^gs:\/\//, "");
  if (!value) {
    throw Object.assign(new Error("FIRESTORE_BACKUP_BUCKET is not configured."), {
      status: 503,
    });
  }
  return value;
}

async function accessToken(): Promise<string> {
  const credential = getFirebaseAdminApp().options.credential;
  if (!credential) throw new Error("Firebase Admin credential is unavailable.");
  const token = await credential.getAccessToken();
  if (!token.access_token) throw new Error("Unable to obtain a Google Cloud access token.");
  return token.access_token;
}

export async function startFirestoreExport(actorId: string): Promise<{
  operationName: string;
  outputUriPrefix: string;
  requestId: string;
}> {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  if (!projectId) throw new Error("FIREBASE_PROJECT_ID is not configured.");

  const requestId = crypto.randomUUID();
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outputUriPrefix = `gs://${backupBucket()}/firestore/${stamp}`;
  const token = await accessToken();
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default):exportDocuments`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ outputUriPrefix }),
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    },
  );
  const payload = (await response.json().catch(() => ({}))) as {
    name?: string;
    error?: { message?: string; status?: string };
  };
  if (!response.ok || !payload.name) {
    throw new Error(
      payload.error?.message ?? `Firestore export request failed (${response.status}).`,
    );
  }

  await getAdminDb().collection("backupRequests").doc(requestId).set({
    id: requestId,
    actorId,
    operationName: payload.name,
    outputUriPrefix,
    status: "requested",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { operationName: payload.name, outputUriPrefix, requestId };
}

export async function listBackupRequests(limit = 50): Promise<Array<Record<string, unknown>>> {
  const snapshot = await getAdminDb()
    .collection("backupRequests")
    .orderBy("createdAt", "desc")
    .limit(Math.max(1, Math.min(100, limit)))
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
