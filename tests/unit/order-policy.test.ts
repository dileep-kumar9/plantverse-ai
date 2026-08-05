import assert from "node:assert/strict";
import test from "node:test";

import {
  canManuallySetOrderStatus,
  validateManualOrderTransition,
} from "../../lib/commerce/order-policy";

test("refund and payment states are never manually selectable", () => {
  assert.equal(canManuallySetOrderStatus("refund_pending"), false);
  assert.equal(canManuallySetOrderStatus("refunded"), false);
  assert.equal(canManuallySetOrderStatus("refund_failed"), false);
  assert.equal(canManuallySetOrderStatus("paid"), false);
  assert.equal(canManuallySetOrderStatus("shipped"), false);
});

test("paid orders cannot be cancelled before a Stripe refund completes", () => {
  const result = validateManualOrderTransition({
    current: "paid",
    requested: "cancelled",
    hasStripePayment: true,
  });
  assert.equal(result.ok, false);
});

test("refunded orders may be manually closed as cancelled", () => {
  assert.deepEqual(
    validateManualOrderTransition({
      current: "refunded",
      requested: "cancelled",
      hasStripePayment: true,
    }),
    { ok: true },
  );
});
