import { createHmac } from "node:crypto";
import assert from "node:assert/strict";
import test from "node:test";

import { verifyStripeSignature } from "../../lib/commerce/stripe";

test("Stripe webhook verification accepts the matching signed payload", () => {
  const payload = JSON.stringify({ id: "evt_test" });
  const timestamp = Math.floor(Date.now() / 1000);
  const secret = "whsec_test_secret";
  const signature = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  assert.equal(verifyStripeSignature(payload, `t=${timestamp},v1=${signature}`, secret), true);
  assert.equal(verifyStripeSignature(`${payload}x`, `t=${timestamp},v1=${signature}`, secret), false);
});
