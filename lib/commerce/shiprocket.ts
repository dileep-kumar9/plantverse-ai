import type { Order, ShippingAddress } from "@/types/app";

const API_BASE = "https://apiv2.shiprocket.in/v1/external";
let tokenCache: { token: string; expiresAt: number } | null = null;

function configuredToken(): string | null {
  return process.env.SHIPROCKET_TOKEN?.trim() || null;
}

export function shiprocketConfigured(): boolean {
  return Boolean(
    configuredToken() ||
      (process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD),
  );
}

async function getToken(): Promise<string> {
  const staticToken = configuredToken();
  if (staticToken) return staticToken;
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.token;

  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  if (!email || !password) {
    throw Object.assign(new Error("Shiprocket is not configured."), { status: 503 });
  }

  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const payload = (await response.json()) as { token?: string; message?: string };
  if (!response.ok || !payload.token) {
    throw new Error(payload.message ?? `Shiprocket authentication failed (${response.status}).`);
  }
  tokenCache = { token: payload.token, expiresAt: Date.now() + 9 * 24 * 60 * 60 * 1000 };
  return payload.token;
}

async function shiprocketRequest<T>(
  path: string,
  init: { method?: "GET" | "POST"; body?: unknown } = {},
): Promise<T> {
  const token = await getToken();
  const response = await fetch(`${API_BASE}/${path.replace(/^\//, "")}`, {
    method: init.method ?? "GET",
    headers: {
      authorization: `Bearer ${token}`,
      accept: "application/json",
      ...(init.body ? { "content-type": "application/json" } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  const payload = (await response.json().catch(() => ({}))) as T & {
    message?: string;
    errors?: unknown;
  };
  if (!response.ok) {
    throw new Error(
      payload.message ?? `Shiprocket request failed (${response.status}).`,
    );
  }
  return payload;
}

function addressOf(order: Order): ShippingAddress {
  if (typeof order.address === "string") {
    throw new Error("The order does not contain a structured shipping address.");
  }
  return order.address;
}

function splitName(name: string): { first: string; last: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    first: parts[0] || "Customer",
    last: parts.slice(1).join(" ") || ".",
  };
}

export async function createShiprocketOrder(order: Order): Promise<{
  order_id?: number;
  shipment_id?: number;
  status?: string;
  status_code?: number;
}> {
  const address = addressOf(order);
  const { first, last } = splitName(address.name);
  const totalWeight = Math.max(
    0.1,
    order.items.reduce(
      (sum, item) => sum + Number(item.weightKg ?? 0.5) * item.quantity,
      0,
    ),
  );
  const length = Math.max(10, ...order.items.map((item) => Number(item.lengthCm ?? 10)));
  const breadth = Math.max(10, ...order.items.map((item) => Number(item.breadthCm ?? 10)));
  const height = Math.max(5, order.items.reduce((sum, item) => sum + Number(item.heightCm ?? 5), 0));

  return shiprocketRequest("orders/create/adhoc", {
    method: "POST",
    body: {
      order_id: order.orderNumber ?? order.id,
      order_date: new Date(order.createdAt).toISOString().slice(0, 19).replace("T", " "),
      pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION ?? "Primary",
      comment: "PlantVerse prepaid order",
      billing_customer_name: first,
      billing_last_name: last,
      billing_address: address.addressLine1,
      billing_address_2: address.addressLine2 ?? "",
      billing_city: address.city,
      billing_pincode: address.postalCode,
      billing_state: address.state,
      billing_country: "India",
      billing_email: order.customerEmail,
      billing_phone: address.phone,
      shipping_is_billing: true,
      order_items: order.items.map((item) => ({
        name: item.name,
        sku: item.sku ?? item.id,
        units: item.quantity,
        selling_price: item.price,
        discount: 0,
        tax: 0,
        hsn: "",
      })),
      payment_method: "Prepaid",
      shipping_charges: 0,
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: 0,
      sub_total: order.total,
      length,
      breadth,
      height,
      weight: Number(totalWeight.toFixed(3)),
    },
  });
}

export async function assignShiprocketAwb(
  shipmentId: string | number,
): Promise<{
  awb_assign_status?: number;
  response?: {
    data?: {
      awb_code?: string;
      courier_name?: string;
      courier_company_id?: number;
    };
  };
}> {
  const courierId = Number(process.env.SHIPROCKET_DEFAULT_COURIER_ID ?? 0);
  return shiprocketRequest("courier/assign/awb", {
    method: "POST",
    body: {
      shipment_id: Number(shipmentId),
      ...(courierId > 0 ? { courier_id: courierId } : {}),
    },
  });
}

export async function scheduleShiprocketPickup(
  shipmentId: string | number,
): Promise<Record<string, unknown>> {
  return shiprocketRequest("courier/generate/pickup", {
    method: "POST",
    body: { shipment_id: [Number(shipmentId)] },
  });
}

export async function trackShiprocketAwb(
  awbCode: string,
): Promise<Record<string, unknown>> {
  return shiprocketRequest(`courier/track/awb/${encodeURIComponent(awbCode)}`);
}

export async function cancelShiprocketOrder(
  shiprocketOrderIds: Array<string | number>,
): Promise<Record<string, unknown>> {
  return shiprocketRequest("orders/cancel", {
    method: "POST",
    body: { ids: shiprocketOrderIds.map(Number).filter(Number.isFinite) },
  });
}

export async function testShiprocketConnection(): Promise<boolean> {
  await getToken();
  return true;
}
