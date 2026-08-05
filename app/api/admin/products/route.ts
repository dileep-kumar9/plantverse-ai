import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import { createProduct, listProducts } from "@/lib/commerce/products";
import { enforceRateLimit } from "@/lib/rate-limit";
import { assertSameOrigin, cleanText, validateJsonSize } from "@/lib/security";
import { requireAdmin } from "@/lib/server/require-user";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    await enforceRateLimit(request, "admin-products", 120, 60, admin.sub);
    return NextResponse.json({ items: await listProducts({ limit: 500 }) });
  } catch (error) {
    const status = Number((error as { status?: number }).status ?? 500);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load products." }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const admin = await requireAdmin(request);
    await enforceRateLimit(request, "admin-product-create", 30, 60, admin.sub);
    const body = (await request.json()) as Record<string, unknown>;
    validateJsonSize(body, 30_000);
    const requestedId = cleanText(body.id, 128);
    const id = /^[A-Za-z0-9_-]{2,128}$/.test(requestedId)
      ? requestedId
      : `product-${randomUUID().slice(0, 8)}`;
    const item = await createProduct(id, body);
    await writeAuditLog({ action: "product.created", resourceType: "product", resourceId: id, actor: { id: admin.sub, email: admin.email, role: admin.role }, request, metadata: { sku: item.sku, stock: item.stock } });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    const status = Number((error as { status?: number }).status ?? 400);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create product." }, { status });
  }
}
