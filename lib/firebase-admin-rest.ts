import {
  FieldValue,
  Timestamp,
  type DocumentData,
  type DocumentReference,
  type Firestore,
  type QueryDocumentSnapshot,
  type Transaction,
} from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase/admin";

function serializeValue(value: unknown): unknown {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(serializeValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        serializeValue(item),
      ]),
    );
  }
  return value;
}

function serializeSnapshot<T extends Record<string, unknown>>(
  snapshot: QueryDocumentSnapshot<DocumentData> | { id: string; data(): DocumentData | undefined },
): T & { id: string } {
  return {
    ...(serializeValue(snapshot.data() ?? {}) as T),
    id: snapshot.id,
  };
}

function database(): Firestore {
  return getAdminDb();
}

function document(path: string): DocumentReference<DocumentData> {
  return database().doc(path);
}

export async function getDocument<T extends Record<string, unknown>>(
  path: string,
): Promise<(T & { id: string }) | null> {
  const snapshot = await document(path).get();
  if (!snapshot.exists) return null;
  return serializeSnapshot<T>(snapshot);
}

export async function setDocument<T extends Record<string, unknown>>(
  path: string,
  data: T,
): Promise<T & { id: string }> {
  const ref = document(path);
  await ref.set(data, { merge: false });
  const snapshot = await ref.get();
  return serializeSnapshot<T>(snapshot);
}

export async function createDocument<T extends Record<string, unknown>>(
  path: string,
  data: T,
): Promise<T & { id: string }> {
  const ref = document(path);
  await ref.create(data);
  const snapshot = await ref.get();
  return serializeSnapshot<T>(snapshot);
}

export async function mergeDocument<T extends Record<string, unknown>>(
  path: string,
  patch: T,
): Promise<T & { id: string }> {
  const ref = document(path);
  await ref.set(patch, { merge: true });
  const snapshot = await ref.get();
  return serializeSnapshot<T>(snapshot);
}

export async function deleteDocument(path: string): Promise<void> {
  await document(path).delete();
}

export async function listDocuments<T extends Record<string, unknown>>(
  collectionPath: string,
  limit = 100,
): Promise<Array<T & { id: string }>> {
  const safeLimit = Math.max(1, Math.min(1000, Math.floor(limit)));
  const snapshot = await database().collection(collectionPath).limit(safeLimit).get();
  return snapshot.docs.map((item) => serializeSnapshot<T>(item));
}

export async function deleteCollection(collectionPath: string): Promise<void> {
  await database().recursiveDelete(database().collection(collectionPath));
}

export async function deleteUserData(uid: string): Promise<void> {
  await database().recursiveDelete(database().doc(`users/${uid}`));
}

export function isRetryableTransactionError(error: unknown): boolean {
  const value = error as {
    code?: string | number;
    status?: string | number;
    message?: string;
  };
  const code = String(value.code ?? value.status ?? "").toUpperCase();
  const message = String(value.message ?? "").toUpperCase();

  return (
    code === "10" ||
    code === "9" ||
    code.includes("ABORTED") ||
    code.includes("FAILED_PRECONDITION") ||
    message.includes("ABORTED") ||
    message.includes("FAILED_PRECONDITION") ||
    message.includes("TRANSACTION CONFLICT")
  );
}

export async function runTransactionWithRetry<T>(
  operation: (transaction: Transaction, db: Firestore) => Promise<T>,
  maximumAttempts = 5,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
    try {
      return await database().runTransaction((transaction) =>
        operation(transaction, database()),
      );
    } catch (error) {
      lastError = error;
      if (!isRetryableTransactionError(error) || attempt === maximumAttempts) {
        throw error;
      }
      await new Promise((resolve) =>
        setTimeout(resolve, Math.min(500, 50 * 2 ** (attempt - 1))),
      );
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Firestore transaction failed.");
}

export { FieldValue, Timestamp };
