import type { Metadata } from "next";
import Link from "next/link";

import { getLegalOperator, PRIVACY_VERSION } from "@/lib/legal";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  const operator = getLegalOperator();
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <article className="dashboard-panel prose-policy">
        <p className="eyebrow">Legal</p>
        <h1 className="mt-3 text-3xl font-semibold">Privacy Policy</h1>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">Policy version: {PRIVACY_VERSION}</p>
        <section><h2>1. Operator and contact</h2><p>{operator.legalName}, trading as {operator.tradeName}, operates PlantVerse AI from {operator.address}, {operator.city}, {operator.state} {operator.postalCode}, {operator.country}. Privacy requests: <a href={`mailto:${operator.privacyEmail}`}>{operator.privacyEmail}</a>. Support: <a href={`mailto:${operator.supportEmail}`}>{operator.supportEmail}</a>, {operator.supportPhone}.</p></section>
        <section><h2>2. Data we process</h2><p>We process account identifiers, profile details, authentication provider information, plant and soil scans, notes, saved reports, reminders, device readings, community posts, cart and order information, shipping details, notification tokens, service usage, consent records, security events and audit logs. Payment card details are collected by Stripe and are not stored by PlantVerse.</p></section>
        <section><h2>3. Why we process it</h2><p>We use data to provide accounts, synchronize user records, run AI analysis, deliver reminders, fulfil orders, prevent abuse, respond to support requests, maintain security, comply with legal obligations and improve product reliability. Optional analytics runs only after consent.</p></section>
        <section><h2>4. AI and service providers</h2><p>Evidence submitted for analysis may be sent to the configured AI provider. Authentication and application data use Firebase services. Payments use Stripe, fulfilment may use Shiprocket, rate limiting may use Upstash, and monitoring may use the configured Sentry-compatible endpoint. Each provider processes data under its own terms and the operator&apos;s service agreement.</p></section>
        <section><h2>5. Retention</h2><p>User records remain while the account is active or as needed to provide the service. Users can delete eligible records and request an account export. Account deletion removes personal workspace data and anonymizes order records that must be retained for fraud, tax, accounting, refund or consumer-law obligations. Security and audit records are retained only for the configured compliance period.</p></section>
        <section><h2>6. Sharing and international transfers</h2><p>We do not sell personal data. We share data only with processors needed to operate the service, with merchants and couriers needed to fulfil an order, when the user directs us, or when required by law. Provider infrastructure may process data outside the user&apos;s state or country subject to applicable safeguards.</p></section>
        <section><h2>7. Security</h2><p>PlantVerse uses verified authentication, HTTP-only sessions, restricted server credentials, encrypted transport, rate limits, audit logging and access controls. No online system is risk-free; users should not upload secrets, identity documents or unrelated sensitive material.</p></section>
        <section><h2>8. Your choices and rights</h2><p>Users can access, correct, export and delete account data through the profile and settings pages, subject to lawful retention requirements. Analytics and notification consent can be changed. Additional rights may apply based on location; contact {operator.privacyEmail}.</p></section>
        <section><h2>9. Children</h2><p>PlantVerse is not intended for children to create independent commercial accounts. A parent, guardian, school or organization must supervise use where required by law.</p></section>
        <section><h2>10. Complaints and changes</h2><p>Contact the privacy address first so we can investigate. Users may also contact the competent data-protection or consumer authority. Material policy changes will be versioned and may require renewed consent.</p></section>
        <div className="mt-8 flex flex-wrap gap-4 text-sm"><Link href="/terms" className="font-semibold text-[var(--brand-primary)]">Terms</Link><Link href="/cookies" className="font-semibold text-[var(--brand-primary)]">Cookie choices</Link><Link href="/safety" className="font-semibold text-[var(--brand-primary)]">AI & Plant Safety</Link></div>
      </article>
    </main>
  );
}
