import assert from "node:assert/strict";
import test from "node:test";

import { isRetryableTransactionError } from "../../lib/firebase-admin-rest";

test("Firestore ABORTED variants are retryable", () => {
  assert.equal(isRetryableTransactionError({ code: 10 }), true);
  assert.equal(isRetryableTransactionError({ code: "ABORTED" }), true);
  assert.equal(isRetryableTransactionError({ message: "transaction ABORTED" }), true);
});

test("Firestore FAILED_PRECONDITION variants are retryable", () => {
  assert.equal(isRetryableTransactionError({ code: 9 }), true);
  assert.equal(isRetryableTransactionError({ status: "FAILED_PRECONDITION" }), true);
  assert.equal(
    isRetryableTransactionError({ message: "FAILED_PRECONDITION transaction conflict" }),
    true,
  );
});

test("non-conflict failures are not retried", () => {
  assert.equal(isRetryableTransactionError({ code: 7, message: "PERMISSION_DENIED" }), false);
});
