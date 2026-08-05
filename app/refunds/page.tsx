import type { Metadata } from "next";

import { getLegalOperator, REFUND_POLICY_VERSION } from "@/lib/legal";

export const metadata: Metadata = { title: "Refund and Cancellation Policy" };

export default function RefundsPage() {
  const operator = getLegalOperator();
  return <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6"><article className="dashboard-panel prose-policy"><p className="eyebrow">Commerce</p><h1>Refund and Cancellation Policy</h1><p>Policy version: {REFUND_POLICY_VERSION}</p><section><h2>Before shipment</h2><p>Unpaid orders may expire automatically. Paid orders can be cancelled only through support or the controlled admin workflow. Once a courier pickup is scheduled, cancellation may depend on carrier status.</p></section><section><h2>Damaged, incorrect or missing items</h2><p>Contact {operator.supportEmail} promptly with the order number, package label and clear photos or video. The operator will review the evidence and applicable consumer rights before replacement, partial refund or full refund.</p></section><section><h2>Non-returnable items</h2><p>Perishable plants, opened chemicals, contaminated soil products, customized items and used meters may be non-returnable except when defective, damaged, misdescribed or otherwise protected by law. The product page must disclose any additional restrictions before purchase.</p></section><section><h2>Refund processing</h2><p>Approved refunds are created through Stripe against the original payment. PlantVerse does not manually mark an order refunded without a provider refund record. Bank processing time is outside the operator&apos;s direct control.</p></section><section><h2>Statutory rights</h2><p>This policy does not reduce rights that cannot be waived under applicable consumer law. Contact {operator.supportEmail} or {operator.supportPhone} for assistance.</p></section></article></main>;
}
