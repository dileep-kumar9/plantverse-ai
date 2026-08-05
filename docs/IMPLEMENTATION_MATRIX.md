# Public-user implementation matrix

| Public-launch requirement | Implementation | External acceptance required |
|---|---|---|
| Login, signup, verification, reset, Google login | Firebase Auth pages, explicit legal consent and secure session route | Provider setup, templates, authorized domains and end-to-end tests |
| No hard-coded personal profile | Profile comes from authenticated Firebase/Firestore user | Test account edits and cross-device refresh |
| Cloud data sync | Server-only Firestore collections for user/application data | Production rules/indexes deployment and ownership tests |
| Live weather | Open-Meteo route after explicit geolocation action | Permission denial, location and outage tests |
| Real payments/refunds | Stripe Checkout, signed webhooks and dedicated refund route | Stripe test/live credentials and webhook scenarios |
| Real inventory/fulfilment | Firestore catalogue, atomic reservation, restocking and Shiprocket workflow | Real catalogue, pickup, courier, supplier and warehouse procedures |
| Delivery tracking | Shiprocket tracking sync/webhook and customer order timeline | Test shipment through all relevant courier states |
| Push notifications | FCM token API, root service worker, foreground/background handling | VAPID setup and browser/device matrix |
| Marketplace catalogue | Firestore products and admin inventory controls | Real approved products, tax, labels, expiry and restrictions |
| Community moderation/experts | Cloud posts, reports, admin moderation and verified-expert records | Moderation staffing and credential-verification policy |
| Device integrations | Manual, standard/custom BLE, Web Serial and signed vendor gateway | Per-model protocol documentation and acceptance |
| Admin dashboard | Readiness, products, orders, refunds, shipments, experts, moderation, backups and audits | Named admin accounts with MFA and least privilege |
| Rate limits and quotas | Upstash distributed limits plus Firestore daily AI quotas | Load/429 testing across deployments |
| Monitoring and analytics | Structured logs, Sentry-compatible reporting and consent-gated GA | Test event verification and consent withdrawal check |
| Backups and audit logs | Manual/daily managed exports, restore documentation and audit collection | Bucket IAM/lifecycle and completed restore drill |
| Legal/consent/deletion | Legal pages, versioned consent, export and recent-auth deletion | Real operator values and legal review |
| Automated tests | Unit, Playwright, smoke, strict external acceptance and CI | Install dependencies and run against preview/staging |
