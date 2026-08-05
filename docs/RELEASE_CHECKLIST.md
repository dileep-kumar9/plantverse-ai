# Public release checklist

## Code and deployment
- [ ] Fresh `package-lock.json` generated and committed
- [ ] `npm run check:secrets`, lint, typecheck, unit tests and build pass
- [ ] Playwright and production smoke tests pass
- [ ] Preview and Production environment variables are separated
- [ ] No `.env.local`, JSON key, `.next`, test video or customer export is committed

## Identity and data
- [ ] Email signup/verification/reset and Google first-login consent pass
- [ ] Authorized domains and email templates are correct
- [ ] Cross-device data sync and ownership isolation pass
- [ ] Export and recent-auth account deletion pass
- [ ] Firestore rules/indexes deployed

## AI and abuse protection
- [ ] Gemini quotas and timeout/failure UX tested
- [ ] Upstash strict distributed rate limiting passes
- [ ] Image/video size, remote URL and unsafe input controls pass

## Commerce and fulfilment
- [ ] Real merchant identity, catalogue, supplier, labels, taxes and inventory entered
- [ ] Atomic reservation conflict/expiry tests pass
- [ ] Stripe test-mode payment/failure/expiry/webhook replay/refund tests pass
- [ ] Shiprocket pickup, AWB, tracking, exception, gateway-signature and cancellation tests pass
- [ ] Shipping/refund policy matches actual operations
- [ ] Commerce remains disabled until all above are approved

## Notifications, monitoring and continuity
- [ ] FCM root service worker, foreground/background, notification-click and disabled-token tests pass
- [ ] Reminder cron and stale inventory release pass
- [ ] Analytics absent before consent and removable after consent
- [ ] Monitoring receives test exception with secrets redacted
- [ ] Manual backup export completes; bucket lifecycle/retention is set; restore drill recorded
- [ ] Scheduled backup cron is enabled only after monitoring and alert ownership are confirmed
- [ ] Audit retention and admin access reviewed

## Legal and launch
- [ ] Every `LEGAL_*` field contains real reviewed information
- [ ] Privacy, Terms, Cookies, Shipping, Refund and Safety pages reviewed
- [ ] Product-specific legal restrictions reviewed
- [ ] Support and incident-response owners assigned
- [ ] Strict external acceptance has zero failed/skipped checks
- [ ] Enable commerce, then indexing, in separate reviewed deployments
