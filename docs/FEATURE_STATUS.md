# PlantVerse AI v5.0 feature status

## Implemented in this public-launch candidate

### Identity and private data
- Firebase Email/Password and Google sign-in, email verification, password reset and recent-auth account deletion
- Explicit Terms and Privacy acceptance for every first session, including first-time Google sign-in
- Revocation-aware HTTP-only session cookies and verified-email administrator allowlist
- Firestore cloud synchronization for profiles, plants, scans, reminders, settings, cart, orders, notifications, chats, device readings and push tokens
- JSON account export and recursive user-data deletion, with paid merchant orders anonymized rather than destroyed

### AI and abuse protection
- Gemini image and small-video analysis, assistant, translation and remote-image import
- Upstash distributed rate limits with a production fail-closed option
- Per-user, per-day Firestore AI quotas by operation
- Media/input limits, safe remote URL handling, origin checks and structured error capture

### Commerce and fulfilment
- Firestore-managed product catalogue with server-side price validation
- Atomic stock reservations, conflict retries, expiry release, sale confirmation and refund restocking
- Stripe Checkout, signed/idempotent webhooks and provider-controlled full or partial refunds
- Manual status rules that prevent administrators from bypassing payment, refund or courier evidence
- Shiprocket order creation, AWB assignment, pickup scheduling, tracking sync and authenticated webhooks
- Customer cart/order interfaces and an administrator catalogue, inventory, order, refund and shipment console

### Notifications, operations and continuity
- In-app notifications, Firebase Cloud Messaging token management and a root service worker for background delivery
- Reminder delivery cron and expired inventory-reservation cleanup
- Daily opt-in Firestore managed exports plus manual export requests and documented restore drills
- Structured JSON logs, Sentry-compatible exception ingestion, a monitored acceptance-test endpoint and audit logs
- Consent-gated Google Analytics settings
- Admin readiness checks for Firebase, Upstash, Stripe, Shiprocket, FCM, backups, monitoring, analytics, legal details and device gateway configuration

### Community, devices and legal
- Firestore community posts, reports, hide/delete moderation and verified-expert records
- Web Bluetooth for documented GATT services, Web Serial parsing, manual readings and signed vendor/gateway ingestion
- Live Open-Meteo weather after explicit browser geolocation permission
- Privacy, Terms, Cookies, Shipping, Refund and AI Safety pages populated from real operator environment variables
- Security headers, PWA manifest/icons, Firestore rules/indexes, CI, unit tests, Playwright tests, smoke tests and strict external acceptance tests

## External configuration still required

The archive contains the application implementation, not credentials or merchant/legal facts. Public launch is blocked until the operator supplies and tests:

- Firebase production project, authorized domains, service-account IAM and FCM Web Push certificate
- Upstash production database
- Stripe live/test credentials and webhook registration
- Shiprocket API user, verified pickup address, courier configuration and webhook gateway secret
- Real product catalogue, inventory, suppliers, tax treatment, labels and fulfilment procedures
- Backup bucket, lifecycle policy and successful restore drill
- Monitoring project, analytics property and reviewed consent behavior
- Real `LEGAL_*` operator details and jurisdiction-specific legal review
- Device-specific protocols or vendor gateways for each supported commercial sensor

## Release label

This project must remain labelled **public-launch candidate** until the release checklist and strict external acceptance tests pass with production/staging accounts. Commerce and indexing are disabled by default.
