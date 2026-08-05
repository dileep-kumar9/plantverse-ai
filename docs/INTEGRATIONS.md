# Production integrations

| Integration | Purpose | Required configuration | Acceptance evidence |
|---|---|---|---|
| Firebase Authentication | Email/Password, Google, verification, sessions | Web SDK variables, Admin service account, authorized domains | Signup, verification, Google consent, login, logout, revocation and account deletion tests |
| Firestore | Cloud user data, catalogue, inventory, orders, notifications, audit | Production database, deny-all client rules, indexes | Admin readiness test, cross-device CRUD, transaction conflict and quota tests |
| Firebase Cloud Messaging | Browser push | Web Push certificate/VAPID key and service worker | Enable/disable token, foreground and background test notification |
| Upstash Redis | Distributed rate limits | REST URL/token, `REQUIRE_DISTRIBUTED_RATE_LIMIT=true` | PING plus repeated-request 429 test across deployments |
| Stripe | Hosted payment and refunds | Secret key, signed webhook, return URLs | Test-mode payment, expiry, failure, full/partial refund, replay/idempotency |
| Shiprocket | Fulfilment and courier tracking | API account/token, verified pickup, HMAC-signing webhook gateway secret | Create test order, AWB, pickup, tracking sync, webhook replay and cancellation |
| Open-Meteo | Live current weather | No secret; outbound access | Permission denial, valid location and service failure tests |
| Google Analytics | Optional product analytics | Measurement ID | No request before consent; request after consent; withdrawal test |
| Sentry-compatible endpoint | Server exceptions | DSN/environment | Deliberate test exception reaches the selected project without secrets |
| Firestore export | Backups | Blaze billing, backup bucket, import/export IAM | Export completes, object lifecycle policy, documented restore drill |
| Vendor device gateway | Vendor/cloud sensors | HMAC secret and gateway mapping | Valid/invalid signature, stale reading and normalized data tests |
