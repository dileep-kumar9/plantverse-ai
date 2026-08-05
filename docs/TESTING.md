# Testing strategy

- **Unit:** inventory request normalization, shipping validation, Stripe signature verification, refund/order transition policy and Firestore conflict retry classification.
- **Type/lint/build:** `npm run verify`.
- **Browser:** `npm run test:e2e` checks public pages and unauthenticated route protection. Add credentialed Firebase test users in a private CI environment for full account flows.
- **Smoke:** `SMOKE_BASE_URL=https://preview.example npm run test:smoke`.
- **External acceptance:** `EXTERNAL_ACCEPTANCE_STRICT=true npm run test:external`. Strict mode fails for missing or failing Firebase, Gemini, Upstash, Stripe, Shiprocket and required FCM/webhook/backup/monitoring/analytics/legal configuration checks.
- **Manual provider scenarios:** payment expiry, webhook replay, partial/full refund, stock conflict, courier exception, notification denial/revocation, backup export/restore, Google first-login consent and account deletion after recent reauthentication.

Never run refund, shipment or deletion tests against customer data. Use dedicated Firebase/Stripe/Shiprocket test records.
