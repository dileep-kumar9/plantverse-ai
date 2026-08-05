import type { OrderStatus } from "@/types/app";

const MANUAL_ORDER_STATUSES = new Set<OrderStatus>(["processing", "cancelled"]);

export function canManuallySetOrderStatus(status: OrderStatus): boolean {
  return MANUAL_ORDER_STATUSES.has(status);
}

export function validateManualOrderTransition(input: {
  current: OrderStatus;
  requested: OrderStatus;
  hasStripePayment: boolean;
}): { ok: true } | { ok: false; message: string } {
  if (!canManuallySetOrderStatus(input.requested)) {
    return {
      ok: false,
      message:
        "Payment, refund and courier-controlled statuses cannot be changed manually. Use the dedicated refund or shipment action.",
    };
  }

  if (
    input.requested === "cancelled" &&
    input.hasStripePayment &&
    !["payment_expired", "payment_failed", "refunded"].includes(input.current)
  ) {
    return {
      ok: false,
      message: "A paid order must be refunded through Stripe before it can be cancelled.",
    };
  }

  if (
    input.requested === "processing" &&
    !["paid", "processing"].includes(input.current)
  ) {
    return {
      ok: false,
      message: "Only a paid order can enter processing.",
    };
  }

  return { ok: true };
}
