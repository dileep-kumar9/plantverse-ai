import { FieldValue } from "firebase-admin/firestore";

import { runTransactionWithRetry } from "@/lib/firebase-admin-rest";
import { getAdminDb } from "@/lib/firebase/admin";
import type { Product } from "@/types/app";

export type RequestedInventoryItem = {
  productId: string;
  quantity: number;
};

export type ReservedInventoryItem = {
  productId: string;
  sku: string;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  currency: "INR";
  icon: string;
  category: string;
  tag: string;
  weightKg: number;
  lengthCm: number;
  breadthCm: number;
  heightCm: number;
  fulfilmentEnabled: boolean;
};

export type InventoryReservation = {
  id: string;
  orderId: string;
  userId: string;
  status: "reserved" | "fulfilled" | "released";
  items: ReservedInventoryItem[];
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  releaseReason?: string;
};

function finite(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function productFromData(id: string, data: Record<string, unknown>): Product {
  return {
    id,
    sku: String(data.sku ?? id),
    name: String(data.name ?? "Product"),
    description: String(data.description ?? ""),
    price: finite(data.price),
    currency: "INR",
    stock: Math.max(0, Math.floor(finite(data.stock))),
    reserved: Math.max(0, Math.floor(finite(data.reserved))),
    sold: Math.max(0, Math.floor(finite(data.sold))),
    active: data.active === true,
    category: String(data.category ?? "General"),
    tag: String(data.tag ?? ""),
    icon: String(data.icon ?? "🌿"),
    imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls.map(String).slice(0, 8) : [],
    weightKg: Math.max(0.01, finite(data.weightKg, 0.5)),
    lengthCm: Math.max(1, finite(data.lengthCm, 10)),
    breadthCm: Math.max(1, finite(data.breadthCm, 10)),
    heightCm: Math.max(1, finite(data.heightCm, 10)),
    taxCode: String(data.taxCode ?? ""),
    fulfilmentEnabled: data.fulfilmentEnabled !== false,
  };
}

export function normalizeInventoryRequest(
  input: Array<{ id?: unknown; quantity?: unknown }>,
): RequestedInventoryItem[] {
  const combined = new Map<string, number>();
  for (const item of input.slice(0, 50)) {
    const productId = String(item.id ?? "").trim();
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(productId)) continue;
    const quantity = Math.max(1, Math.min(10, Math.floor(finite(item.quantity, 1))));
    combined.set(productId, Math.min(10, (combined.get(productId) ?? 0) + quantity));
  }
  return [...combined.entries()].map(([productId, quantity]) => ({ productId, quantity }));
}

export async function reserveInventory(input: {
  orderId: string;
  userId: string;
  items: RequestedInventoryItem[];
  expiresAt: Date;
}): Promise<InventoryReservation> {
  if (!input.items.length) throw Object.assign(new Error("Your cart is empty."), { status: 400 });

  return runTransactionWithRetry(async (transaction, db) => {
    const reservationRef = db.collection("inventoryReservations").doc(input.orderId);
    const existing = await transaction.get(reservationRef);
    if (existing.exists) {
      const data = existing.data() as InventoryReservation;
      if (data.status === "reserved" || data.status === "fulfilled") return { ...data, id: input.orderId };
      throw Object.assign(new Error("This inventory reservation is no longer active."), { status: 409 });
    }

    const productRefs = input.items.map((item) => db.collection("products").doc(item.productId));
    const snapshots = await transaction.getAll(...productRefs);
    const reservedItems: ReservedInventoryItem[] = [];

    snapshots.forEach((snapshot, index) => {
      if (!snapshot.exists) {
        throw Object.assign(new Error("A product in your cart is no longer available."), { status: 409 });
      }
      const product = productFromData(snapshot.id, snapshot.data() ?? {});
      const requested = input.items[index];
      if (!product.active) {
        throw Object.assign(new Error(`${product.name} is not currently available.`), { status: 409 });
      }
      if (product.stock < requested.quantity) {
        throw Object.assign(
          new Error(`${product.name} has only ${product.stock} item(s) available.`),
          { status: 409, code: "INSUFFICIENT_STOCK", productId: product.id },
        );
      }

      transaction.update(snapshot.ref, {
        stock: FieldValue.increment(-requested.quantity),
        reserved: FieldValue.increment(requested.quantity),
        updatedAt: FieldValue.serverTimestamp(),
      });

      reservedItems.push({
        productId: product.id,
        sku: product.sku,
        name: product.name,
        description: product.description,
        quantity: requested.quantity,
        unitPrice: product.price,
        currency: "INR",
        icon: product.icon ?? "🌿",
        category: product.category,
        tag: product.tag ?? "",
        weightKg: product.weightKg ?? 0.5,
        lengthCm: product.lengthCm ?? 10,
        breadthCm: product.breadthCm ?? 10,
        heightCm: product.heightCm ?? 10,
        fulfilmentEnabled: product.fulfilmentEnabled !== false,
      });
    });

    const now = new Date().toISOString();
    const reservation: InventoryReservation = {
      id: input.orderId,
      orderId: input.orderId,
      userId: input.userId,
      status: "reserved",
      items: reservedItems,
      expiresAt: input.expiresAt.toISOString(),
      createdAt: now,
      updatedAt: now,
    };
    transaction.create(reservationRef, reservation);
    return reservation;
  });
}

export async function fulfillInventoryReservation(orderId: string): Promise<InventoryReservation | null> {
  return runTransactionWithRetry(async (transaction, db) => {
    const reservationRef = db.collection("inventoryReservations").doc(orderId);
    const snapshot = await transaction.get(reservationRef);
    if (!snapshot.exists) return null;
    const reservation = { ...(snapshot.data() as InventoryReservation), id: snapshot.id };
    if (reservation.status === "fulfilled") return reservation;
    if (reservation.status !== "reserved") return reservation;

    for (const item of reservation.items) {
      const productRef = db.collection("products").doc(item.productId);
      transaction.update(productRef, {
        reserved: FieldValue.increment(-item.quantity),
        sold: FieldValue.increment(item.quantity),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    const updated = { ...reservation, status: "fulfilled" as const, updatedAt: new Date().toISOString() };
    transaction.update(reservationRef, {
      status: updated.status,
      updatedAt: updated.updatedAt,
      fulfilledAt: updated.updatedAt,
    });
    return updated;
  });
}

export async function releaseInventoryReservation(
  orderId: string,
  reason: string,
): Promise<InventoryReservation | null> {
  return runTransactionWithRetry(async (transaction, db) => {
    const reservationRef = db.collection("inventoryReservations").doc(orderId);
    const snapshot = await transaction.get(reservationRef);
    if (!snapshot.exists) return null;
    const reservation = { ...(snapshot.data() as InventoryReservation), id: snapshot.id };
    if (reservation.status !== "reserved") return reservation;

    for (const item of reservation.items) {
      const productRef = db.collection("products").doc(item.productId);
      transaction.update(productRef, {
        stock: FieldValue.increment(item.quantity),
        reserved: FieldValue.increment(-item.quantity),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    const now = new Date().toISOString();
    transaction.update(reservationRef, {
      status: "released",
      releaseReason: reason.slice(0, 200),
      releasedAt: now,
      updatedAt: now,
    });
    return { ...reservation, status: "released", releaseReason: reason, updatedAt: now };
  });
}

export async function restockFulfilledOrder(orderId: string): Promise<boolean> {
  return runTransactionWithRetry(async (transaction, db) => {
    const reservationRef = db.collection("inventoryReservations").doc(orderId);
    const snapshot = await transaction.get(reservationRef);
    if (!snapshot.exists) return false;
    const reservation = snapshot.data() as InventoryReservation & { restockedAt?: string };
    if (reservation.status !== "fulfilled" || reservation.restockedAt) return false;

    for (const item of reservation.items) {
      const productRef = db.collection("products").doc(item.productId);
      transaction.update(productRef, {
        stock: FieldValue.increment(item.quantity),
        sold: FieldValue.increment(-item.quantity),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    transaction.update(reservationRef, {
      restockedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return true;
  });
}

export async function releaseExpiredReservations(limit = 100): Promise<number> {
  const db = getAdminDb();
  const snapshot = await db
    .collection("inventoryReservations")
    .where("status", "==", "reserved")
    .where("expiresAt", "<=", new Date().toISOString())
    .limit(Math.max(1, Math.min(500, limit)))
    .get();
  let released = 0;
  for (const item of snapshot.docs) {
    const result = await releaseInventoryReservation(item.id, "reservation_expired");
    if (result?.status === "released") released += 1;
  }
  return released;
}
