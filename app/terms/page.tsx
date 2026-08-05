import type { Metadata } from "next";
import Link from "next/link";

import { getLegalOperator, TERMS_VERSION } from "@/lib/legal";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  const operator = getLegalOperator();
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <article className="dashboard-panel prose-policy">
        <p className="eyebrow">Legal</p><h1 className="mt-3 text-3xl font-semibold">Terms of Service</h1><p className="mt-3 text-sm text-[var(--text-secondary)]">Terms version: {TERMS_VERSION}</p>
        <section><h2>1. Agreement and operator</h2><p>These terms are between you and {operator.legalName}, trading as {operator.tradeName}, at {operator.address}, {operator.city}, {operator.state} {operator.postalCode}, {operator.country}. By creating an account or using PlantVerse you accept these Terms and the Privacy Policy.</p></section>
        <section><h2>2. Informational AI service</h2><p>PlantVerse provides automated observations and suggestions from user-supplied evidence. Results may be incomplete or incorrect and do not replace laboratory testing, product labels, licensed pest-control advice, veterinary or medical advice, or qualified local agronomy guidance.</p></section>
        <section><h2>3. Accounts and acceptable use</h2><p>You must provide accurate information, keep your account secure and use the service lawfully. You must not attack the service, evade limits, upload unlawful or harmful content, impersonate experts, misuse personal data, automate abusive requests or rely on the service to create unsafe chemical instructions.</p></section>
        <section><h2>4. Community and experts</h2><p>Users remain responsible for posts. A verified badge means the operator reviewed submitted credentials; it is not a guarantee of every statement, continuing licence or suitability for a particular case. Content may be reported, hidden, preserved for investigation or removed.</p></section>
        <section><h2>5. Marketplace</h2><p>When commerce is enabled, the product page, checkout, Shipping Policy and Refund Policy form part of the purchase terms. Orders are accepted only after successful payment and stock confirmation. Prices and taxes are shown before payment. We may cancel and refund orders affected by inventory, address, fraud, safety or fulfilment problems.</p></section>
        <section><h2>6. Payments, delivery and refunds</h2><p>Payments are processed by Stripe. Shipments may be fulfilled through Shiprocket and its courier partners. Estimated delivery dates are not guarantees. Refunds must be initiated through the operator&apos;s controlled refund workflow and are governed by the Refund Policy and mandatory consumer rights.</p></section>
        <section><h2>7. Intellectual property</h2><p>PlantVerse software, branding and original materials are protected by applicable law. Users retain rights in their content and grant the limited licence necessary to store, process, display, moderate and deliver the requested service.</p></section>
        <section><h2>8. Availability and changes</h2><p>The service depends on third parties and may be interrupted, changed or restricted for security, legal, cost or maintenance reasons. We may introduce fair-use limits and paid plans with prior disclosure.</p></section>
        <section><h2>9. Liability</h2><p>To the maximum extent permitted by law, PlantVerse does not guarantee identification, diagnosis, treatment, yield, product compatibility, uninterrupted availability or a particular result. Nothing excludes mandatory consumer rights or liability that cannot legally be excluded.</p></section>
        <section><h2>10. Governing law, disputes and contact</h2><p>These terms are governed by the laws applicable in {operator.jurisdiction}, subject to mandatory consumer protections. Contact {operator.supportEmail} or {operator.supportPhone} before formal escalation so the operator can investigate and attempt resolution.</p></section>
        <div className="mt-8 flex flex-wrap gap-4 text-sm"><Link href="/privacy" className="font-semibold text-[var(--brand-primary)]">Privacy Policy</Link><Link href="/shipping" className="font-semibold text-[var(--brand-primary)]">Shipping Policy</Link><Link href="/refunds" className="font-semibold text-[var(--brand-primary)]">Refund Policy</Link><Link href="/safety" className="font-semibold text-[var(--brand-primary)]">Safety</Link></div>
      </article>
    </main>
  );
}
