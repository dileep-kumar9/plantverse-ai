# Production setup

## 1. Firebase

Enable Email/Password and Google providers. Add `localhost`, the Vercel production domain and any verified custom domain to Firebase Authentication authorized domains. Create Firestore in Production mode and deploy `firebase/firestore.rules` and `firebase/firestore.indexes.json`.

Use a dedicated server service account. The application requires normal Firestore document access and Firebase Authentication administration. Backups additionally require Firestore import/export permissions and write access to the configured Cloud Storage bucket. Store the private key only in Vercel encrypted environment variables.

Create a Web Push certificate and set `NEXT_PUBLIC_FIREBASE_VAPID_KEY` before enabling browser push.

## 2. Vercel

Add the variables from `.env.example` separately for Preview and Production. Use the production URL for `NEXT_PUBLIC_APP_URL`. Configure `CRON_SECRET`; `vercel.json` invokes the reminder/reservation-release cron every 15 minutes and the optional Firestore export cron daily. Leave `ENABLE_SCHEDULED_BACKUPS=false` until the backup bucket, IAM and retention policy are verified. Keep indexing and commerce disabled during acceptance.

## 3. Upstash

Create a Redis database close to the primary audience. Add its REST URL/token and set `REQUIRE_DISTRIBUTED_RATE_LIMIT=true` in production. The app fails closed for protected requests when distributed rate limiting is required but unavailable.

## 4. Stripe

Start in test mode. Register `/api/stripe/webhook` for Checkout completion/expiry, asynchronous payment success/failure, payment failures, `charge.refunded` and `refund.failed` events. Use the webhook signing secret, not the dashboard API key, for signature verification. Do not manually set refund states: the app changes them only from Stripe webhook evidence.

## 5. Shiprocket

Verify the business, pickup address, billing and courier settings. Configure credentials and a webhook gateway secret. If Shiprocket cannot emit the required HMAC header directly, route its webhook through a trusted gateway that signs the unmodified raw body with `SHIPROCKET_WEBHOOK_SECRET` and sends `x-plantverse-signature: sha256=<hex>`. Register `/api/shiprocket/webhook` as the gateway destination. Run a low-value internal order through creation, AWB, pickup, tracking and cancellation before enabling commerce.

## 6. Legal operator

Replace every `LEGAL_*` environment variable with the real operator information. Obtain legal review for the jurisdiction, products, returns, taxes, pesticides/fertilizers, consumer obligations and privacy notices. `/api/health` remains degraded while required legal fields are absent.

## 7. Catalogue

Create products from the admin console or review and run `npm run seed:catalog`. Seeded records are inactive with zero stock. Verify suppliers, invoices, labels, tax treatment, dimensions, weights, warranty, expiry, batch tracking and shipping restrictions before activation.

## 8. Backups and monitoring

Configure Sentry-compatible monitoring, verify an admin monitoring acceptance event, test analytics before/after consent, and prepare a dedicated backup bucket with lifecycle/retention policy and restore drills. Only then set `ENABLE_SCHEDULED_BACKUPS=true`. See `BACKUP_AND_RESTORE.md`.

## 9. Verification

Generate a fresh `package-lock.json`, run `npm run verify`, Playwright, smoke tests and `EXTERNAL_ACCEPTANCE_STRICT=true npm run test:external`. Only then enable commerce/indexing.
