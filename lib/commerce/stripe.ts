import { createHmac, timingSafeEqual } from "node:crypto";

import type { ReservedInventoryItem } from "@/lib/commerce/inventory";
import type { ShippingAddress } from "@/types/app";

function stripeSecret(): string {
  const value = process.env.STRIPE_SECRET_KEY;
  if (!value) throw Object.assign(new Error("Stripe is not configured."), { status: 503 });
  return value;
}

async function stripePost<T>(path: string, form: URLSearchParams): Promise<T> {
  const response = await fetch(`https://api.stripe.com/v1/${path.replace(/^\//, "")}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${stripeSecret()}`,
      "content-type": "application/x-www-form-urlencoded",
      "idempotency-key": form.get("metadata[orderId]") || crypto.randomUUID(),
    },
    body: form,
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const data = (await response.json()) as T & { error?: { message?: string; code?: string } };
  if (!response.ok) {
    const error = new Error(data.error?.message ?? `Stripe request failed (${response.status}).`);
    Object.assign(error, { status: response.status, code: data.error?.code });
    throw error;
  }
  return data;
}

export async function createHostedCheckout(input: {
  orderId: string;
  userId: string;
  customerEmail: string;
  address: ShippingAddress;
  items: ReservedInventoryItem[];
  appUrl: string;
  expiresAt: Date;
}): Promise<{ id: string; url: string; payment_status?: string }> {
  const form = new URLSearchParams({
    mode: "payment",
    success_url: `${input.appUrl}/orders?checkout=success&order=${encodeURIComponent(input.orderId)}`,
    cancel_url: `${input.appUrl}/cart?checkout=cancelled&order=${encodeURIComponent(input.orderId)}`,
    customer_email: input.customerEmail,
    client_reference_id: input.orderId,
    "metadata[userId]": input.userId,
    "metadata[orderId]": input.orderId,
    "payment_intent_data[metadata][userId]": input.userId,
    "payment_intent_data[metadata][orderId]": input.orderId,
    billing_address_collection: "required",
    "shipping_address_collection[allowed_countries][0]": "IN",
    expires_at: String(Math.floor(input.expiresAt.getTime() / 1000)),
    "custom_text[shipping_address][message]": "Delivery is currently supported only to verified Indian postal addresses.",
  });

  input.items.forEach((item, index) => {
    form.set(`line_items[${index}][quantity]`, String(item.quantity));
    form.set(`line_items[${index}][price_data][currency]`, "inr");
    form.set(
      `line_items[${index}][price_data][unit_amount]`,
      String(Math.round(item.unitPrice * 100)),
    );
    form.set(`line_items[${index}][price_data][product_data][name]`, item.name);
    form.set(
      `line_items[${index}][price_data][product_data][description]`,
      item.description || item.tag,
    );
    form.set(`line_items[${index}][price_data][product_data][metadata][sku]`, item.sku);
  });

  form.set("metadata[shippingName]", input.address.name.slice(0, 100));
  form.set("metadata[shippingPhone]", input.address.phone.slice(0, 30));
  return stripePost("checkout/sessions", form);
}

export async function createRefund(input: {
  paymentIntentId: string;
  orderId: string;
  amountPaise?: number;
  reason?: "duplicate" | "fraudulent" | "requested_by_customer";
}): Promise<{ id: string; status?: string; amount?: number; payment_intent?: string }> {
  const form = new URLSearchParams({
    payment_intent: input.paymentIntentId,
    reason: input.reason ?? "requested_by_customer",
    "metadata[orderId]": input.orderId,
  });
  if (input.amountPaise && input.amountPaise > 0) {
    form.set("amount", String(Math.floor(input.amountPaise)));
  }
  return stripePost("refunds", form);
}

export function verifyStripeSignature(
  payload: string,
  header: string,
  secret: string,
  toleranceSeconds = 300,
): boolean {
  const parts = header
    .split(",")
    .map((item) => item.trim().split("="))
    .filter((item) => item.length === 2);
  const timestamp = parts.find(([key]) => key === "t")?.[1];
  const signatures = parts.filter(([key]) => key === "v1").map(([, value]) => value);
  if (!timestamp || signatures.length === 0) return false;
  const numericTimestamp = Number(timestamp);
  if (
    !Number.isFinite(numericTimestamp) ||
    Math.abs(Date.now() / 1000 - numericTimestamp) > toleranceSeconds
  ) {
    return false;
  }
  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");
  return signatures.some((signature) => {
    if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
    const left = Buffer.from(expected, "hex");
    const right = Buffer.from(signature, "hex");
    return left.length === right.length && timingSafeEqual(left, right);
  });
}

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
}
