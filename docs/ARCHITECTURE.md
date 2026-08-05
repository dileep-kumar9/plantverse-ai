# PlantVerse AI v5.0 production architecture

## Request and user interface layer

- Next.js 16 App Router renders the dashboard, authentication, scans, records, marketplace, devices, community, legal pages and admin console.
- `proxy.ts` protects private pages and APIs using the HTTP-only session cookie while leaving authentication, legal, health and signed webhook/cron endpoints reachable.
- Client components use same-origin API routes; privileged credentials never enter browser bundles.

## Identity and session boundary

- Firebase Authentication handles Email/Password and Google identities.
- A recently issued, verified-email Firebase ID token is exchanged for a revocation-aware Admin SDK session cookie.
- First-session creation requires current Terms and Privacy versions to be accepted explicitly.
- Administrator access is derived from verified emails in `ADMIN_EMAILS`; all admin actions are server-authorized and audited.

## Data boundary

- Firebase Admin SDK is the only Firestore data path. Browser Firestore rules deny all direct reads and writes.
- User-owned data is stored below `users/{uid}`. Shared operational collections include products, merchant orders, inventory reservations, community posts, verified experts, scheduled reminders, audit logs and backup requests.
- Firestore transactions protect inventory and quota counters. Conflict retry logic handles both `ABORTED` and `FAILED_PRECONDITION` variants with bounded backoff.

## AI boundary

- Gemini credentials remain server-only.
- Every AI route authenticates the user, applies distributed rate limits and daily quotas, validates content size/type, and normalizes the result.
- Remote imports reject non-HTTPS, private-network and unsafe redirect targets.

## Commerce and fulfilment boundary

1. The server reads authoritative product price and stock from Firestore.
2. A Firestore transaction reserves stock before Stripe Checkout is created.
3. Signed Stripe webhooks confirm or expire reservations and create/update customer and merchant order views.
4. Refunds are initiated only through Stripe and completed/failed only from signed provider events.
5. Optional automatic or administrator-approved Shiprocket fulfilment creates the courier order, assigns an AWB, schedules pickup and synchronizes tracking.
6. Signed Shiprocket webhook evidence updates courier-controlled statuses and notifies the customer.

## Notification and background work

- Firebase Cloud Messaging registers browser tokens per user and delivers order, shipment and reminder notifications.
- `/firebase-messaging-sw.js` is generated from public Firebase configuration and receives background messages at the domain root.
- The reminder cron claims due jobs transactionally, sends notifications and releases expired stock reservations.
- A separate daily backup cron can request a managed Firestore export when explicitly enabled.

## Devices

- Web Bluetooth is supported only for user-selected devices with documented standard/custom GATT UUIDs.
- Web Serial accepts user-selected ports and normalizes JSON or key/value measurements.
- Cloud/vendor sensors can send signed, timestamped readings to the vendor gateway endpoint.
- No model is advertised as directly supported until its protocol and field mapping have been acceptance tested.

## Observability and continuity

- Structured server logs redact common secret fields.
- Exceptions can be delivered to a Sentry-compatible ingestion endpoint without adding a browser monitoring SDK.
- Security-sensitive and administrative operations write immutable-style audit records.
- Firestore managed exports target a dedicated Cloud Storage bucket; restoration remains a controlled operator procedure.

## Privacy and legal

- Analytics loads only after an explicit consent setting.
- Live weather coordinates are requested by the browser and are not persisted by the weather route.
- Account export and deletion are available to authenticated users. Merchant records needed for payment, tax, fraud or dispute obligations are anonymized and retained according to the published policy.
- Public legal pages fail visibly or health checks degrade when mandatory operator environment values are absent.
