# Security controls

- Firebase client authentication is exchanged for revocation-aware HTTP-only session cookies.
- Firestore browser rules deny all direct document access; server routes enforce ownership and admin authorization.
- Service-account credentials, Stripe/Shiprocket/Upstash secrets and webhook secrets are server-only.
- State-changing routes use same-origin checks, input limits, rate limits and authenticated ownership.
- Stripe, gateway-signed Shiprocket and device-gateway webhooks verify signatures and store idempotency records.
- Inventory uses Firestore transactions and retries both `ABORTED` and `FAILED_PRECONDITION` conflict variants.
- Refund status cannot be selected manually; it follows Stripe provider events.
- CSP, HSTS, frame denial, MIME sniffing protection and permissions policy are configured in `next.config.ts`.
- `npm run check:secrets` scans source; secret scanning and dependency review should also be enabled in GitHub.
- Admin privileges come from verified emails in `ADMIN_EMAILS`; use separate named accounts with MFA on Google/Firebase/Vercel/provider dashboards.

Report suspected vulnerabilities to the configured `LEGAL_PRIVACY_EMAIL`/security contact. Rotate exposed credentials immediately and review audit logs.
