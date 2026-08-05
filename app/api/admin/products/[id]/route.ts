import { NextRequest, NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import { getProduct, updateProduct } from "@/lib/commerce/products";
import { enforceRateLimit } from "@/lib/rate-limit";
import { assertSameOrigin, cleanText, validateJsonSize } from "@/lib/security";
import { requireAdmin } from "@/lib/server/require-user";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  try {
    assertSameOrigin(request);
    const admin = await requireAdmin(request);
    await enforceRateLimit(request, "admin-product-update", 60, 60, admin.sub);
    const id = cleanText((await context.params).id, 128);
    const body = (await request.json()) as Record<string, unknown>;
    validateJsonSize(body, 30_000);
    delete body.reserved;
    delete body.sold;
    const item = await updateProduct(id, body);
    await writeAuditLog({ action: "product.updated", resourceType: "product", resourceId: id, actor: { id: admin.sub, email: admin.email, role: admin.role }, request, metadata: { sku: item.sku, stock: item.stock, active: item.active } });
    return NextResponse.json({ item });
  } catch (error) {
    const status = Number((error as { status?: number }).status ?? 400);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update product." }, { status });
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    assertSameOrigin(request);
    const admin = await requireAdmin(request);
    const id = cleanText((await context.params).id, 128);
    const product = await getProduct(id);
    if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    if (product.reserved > 0) {
      return NextResponse.json({ error: "Product has active reservations and cannot be removed." }, { status: 409 });
    }
    const item = await updateProduct(id, { active: false });
    await writeAuditLog({ action: "product.archived", resourceType: "product", resourceId: id, actor: { id: admin.sub, email: admin.email, role: admin.role }, request });
    return NextResponse.json({ item });
  } catch (error) {
    const status = Number((error as { status?: number }).status ?? 400);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to archive product." }, { status });
  }
}
