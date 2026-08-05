# PlantVerse AI v5.0 — Public Launch Candidate

PlantVerse is a Next.js 16 application for plant and soil analysis, private plant records, reminders, live weather, device readings, community support and a controlled commerce workflow.

## Implemented production foundations

- Firebase Email/Password and Google authentication with verified email, explicit Terms/Privacy consent and HTTP-only Admin SDK session cookies
- Firestore cloud synchronization for scans, plants, reminders, profile, settings, cart, orders, notifications, chats and device readings
- Gemini image/video analysis, assistant and translation with Upstash rate limits and per-user daily quotas
- Firestore marketplace catalogue, server-priced cart, atomic stock reservation, expiry release, fulfilment and refund restocking
- Stripe hosted Checkout, signed webhook idempotency and provider-controlled refund status
- Shiprocket order creation, AWB assignment, pickup scheduling, tracking synchronization and signed webhooks
- Firebase Cloud Messaging browser push plus in-app notifications and scheduled reminder delivery
- Open-Meteo live weather requested only after browser location consent
- Admin operations for products, inventory, orders, shipments, refunds, experts, community moderation, backups, audit logs and service readiness
- Optional consent-gated Google Analytics and Sentry-compatible server monitoring
- Account JSON export, recent-auth deletion and retained-order anonymization
- Web Bluetooth, Web Serial, manual readings and signed vendor/gateway ingestion
- Legal, privacy, cookie, shipping, refund and AI safety pages driven by real operator environment variables
- Unit tests, Playwright tests, smoke tests, strict external-provider acceptance tests and GitHub Actions CI

## Important release status

This archive is code-complete as a **public-launch candidate**, not a claim that external production accounts have passed acceptance. Public release requires real Firebase, Upstash, Stripe, Shiprocket, FCM, monitoring, analytics, backup-bucket and legal-operator configuration. Commerce remains disabled by default.

## Local setup

1. Copy `.env.example` to `.env.local` and enter your own values. Never commit `.env.local` or service-account JSON.
2. Install and generate a fresh lock file:

```powershell
npm.cmd install
```

3. Run verification:

```powershell
npm.cmd run check:secrets
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test:unit
npm.cmd run build
npm.cmd run test:e2e:install
npm.cmd run test:e2e
```

4. Start locally:

```powershell
npm.cmd run dev
```

## Deployment gates

Keep these disabled until `docs/RELEASE_CHECKLIST.md` is complete and strict acceptance passes:

```env
ENABLE_COMMERCE=false
NEXT_PUBLIC_COMMERCE_ENABLED=false
ALLOW_INDEXING=false
```

See `docs/IMPLEMENTATION_MATRIX.md`, `docs/PRODUCTION_SETUP.md`, `docs/INTEGRATIONS.md`, `docs/SECURITY.md`, `docs/TESTING.md`, `docs/BACKUP_AND_RESTORE.md`, `docs/BUILD_VERIFICATION.md`, and `docs/RELEASE_CHECKLIST.md`.
