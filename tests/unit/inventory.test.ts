import assert from "node:assert/strict";
import test from "node:test";

import { normalizeInventoryRequest } from "../../lib/commerce/inventory";

test("inventory combines duplicate product quantities and limits each line", () => {
  assert.deepEqual(
    normalizeInventoryRequest([
      { id: "soil-meter", quantity: 3 },
      { id: "soil-meter", quantity: 9 },
      { id: "bad/id", quantity: 2 },
      { id: "neem", quantity: -1 },
    ]),
    [
      { productId: "soil-meter", quantity: 10 },
      { productId: "neem", quantity: 1 },
    ],
  );
});
