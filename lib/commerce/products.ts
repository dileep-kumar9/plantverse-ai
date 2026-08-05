import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase/admin";
import { cleanText } from "@/lib/security";
import type { Product } from "@/types/app";

function numberInRange(
  value: unknown,
  minimum: number,
  maximum: number,
  fallback: number,
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(minimum, Math.min(maximum, parsed));
}

export function sanitizeProductInput(
  input: Record<string, unknown>,
  existing?: Partial<Product>,
): Omit<Product, "id" | "createdAt" | "updatedAt"> {
  const name = cleanText(input.name ?? existing?.name, 160);
  const sku = cleanText(input.sku ?? existing?.sku, 80).toUpperCase();
  if (name.length < 2) throw Object.assign(new Error("Enter a product name."), { status: 400 });
  if (!/^[A-Z0-9._-]{2,80}$/.test(sku)) {
    throw Object.assign(new Error("SKU may contain letters, numbers, dots, dashes and underscores."), { status: 400 });
  }
  return {
    sku,
    name,
    description: cleanText(input.description ?? existing?.description, 2_000),
    price: Number(numberInRange(input.price ?? existing?.price, 0.01, 10_000_000, 0).toFixed(2)),
    currency: "INR",
    stock: Math.floor(numberInRange(input.stock ?? existing?.stock, 0, 1_000_000, 0)),
    reserved: Math.floor(numberInRange(existing?.reserved, 0, 1_000_000, 0)),
    sold: Math.floor(numberInRange(existing?.sold, 0, 1_000_000, 0)),
    active: input.active === undefined ? existing?.active !== false : input.active === true,
    category: cleanText(input.category ?? existing?.category ?? "General", 80),
    tag: cleanText(input.tag ?? existing?.tag, 120),
    icon: cleanText(input.icon ?? existing?.icon ?? "🌿", 16),
    imageUrls: (() => {
      const values = input.imageUrls ?? existing?.imageUrls;
      return Array.isArray(values)
        ? values
            .map((item) => cleanText(item, 1_000))
            .filter((item) => /^https:\/\//i.test(item))
            .slice(0, 8)
        : [];
    })(),
    weightKg: numberInRange(input.weightKg ?? existing?.weightKg, 0.01, 100, 0.5),
    lengthCm: numberInRange(input.lengthCm ?? existing?.lengthCm, 1, 500, 10),
    breadthCm: numberInRange(input.breadthCm ?? existing?.breadthCm, 1, 500, 10),
    heightCm: numberInRange(input.heightCm ?? existing?.heightCm, 1, 500, 10),
    taxCode: cleanText(input.taxCode ?? existing?.taxCode, 40),
    fulfilmentEnabled:
      input.fulfilmentEnabled === undefined
        ? existing?.fulfilmentEnabled !== false
        : input.fulfilmentEnabled === true,
  };
}

function serializeProduct(id: string, data: Record<string, unknown>): Product {
  const sanitized = sanitizeProductInput(data, data as Partial<Product>);
  return {
    id,
    ...sanitized,
    createdAt:
      typeof data.createdAt === "string"
        ? data.createdAt
        : data.createdAt && typeof (data.createdAt as { toDate?: unknown }).toDate === "function"
          ? (data.createdAt as { toDate(): Date }).toDate().toISOString()
          : undefined,
    updatedAt:
      typeof data.updatedAt === "string"
        ? data.updatedAt
        : data.updatedAt && typeof (data.updatedAt as { toDate?: unknown }).toDate === "function"
          ? (data.updatedAt as { toDate(): Date }).toDate().toISOString()
          : undefined,
  };
}

export async function listProducts(options: {
  activeOnly?: boolean;
  limit?: number;
} = {}): Promise<Product[]> {
  let query: FirebaseFirestore.Query = getAdminDb().collection("products");
  if (options.activeOnly) query = query.where("active", "==", true);
  const snapshot = await query.limit(Math.max(1, Math.min(500, options.limit ?? 200))).get();
  return snapshot.docs
    .map((doc) => serializeProduct(doc.id, doc.data()))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getProduct(id: string): Promise<Product | null> {
  const snapshot = await getAdminDb().collection("products").doc(id).get();
  if (!snapshot.exists) return null;
  return serializeProduct(snapshot.id, snapshot.data() ?? {});
}

export async function createProduct(
  id: string,
  input: Record<string, unknown>,
): Promise<Product> {
  const data = sanitizeProductInput(input);
  const ref = getAdminDb().collection("products").doc(id);
  await ref.create({
    ...data,
    reserved: 0,
    sold: 0,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return (await getProduct(id)) as Product;
}

export async function updateProduct(
  id: string,
  input: Record<string, unknown>,
): Promise<Product> {
  const existing = await getProduct(id);
  if (!existing) throw Object.assign(new Error("Product not found."), { status: 404 });
  const data = sanitizeProductInput(input, existing);
  await getAdminDb().collection("products").doc(id).set(
    { ...data, reserved: existing.reserved, sold: existing.sold, updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
  return (await getProduct(id)) as Product;
}
