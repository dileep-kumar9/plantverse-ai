import assert from "node:assert/strict";
import test from "node:test";

import { sanitizeShippingAddress } from "../../lib/commerce/address";

test("shipping address normalizes a valid Indian delivery address", () => {
  const address = sanitizeShippingAddress({
    name: "Test User",
    phone: "+91 98765 43210",
    addressLine1: "12 Green Street, Madhapur",
    city: "Hyderabad",
    state: "Telangana",
    postalCode: "500081",
  });
  assert.equal(address.phone, "+919876543210");
  assert.equal(address.country, "IN");
});

test("shipping address rejects invalid PIN codes", () => {
  assert.throws(
    () => sanitizeShippingAddress({
      name: "Test User",
      phone: "9876543210",
      addressLine1: "Complete address",
      city: "Hyderabad",
      state: "Telangana",
      postalCode: "123",
    }),
    /6-digit Indian PIN/,
  );
});
