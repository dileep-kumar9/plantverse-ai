import { NextResponse } from "next/server";

import { listProducts } from "@/lib/commerce/products";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await listProducts({ activeOnly: true, limit: 200 });
    return NextResponse.json(
      { items: items.map((item) => ({ ...item, available: item.stock })) },
      { headers: { "cache-control": "public, max-age=30, stale-while-revalidate=120" } },
    );
  } catch {
    return NextResponse.json({ items: [], error: "Catalogue is temporarily unavailable." }, { status: 503 });
  }
}
