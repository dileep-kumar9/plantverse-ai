import type { Metadata } from "next";

import { getLegalOperator, SHIPPING_POLICY_VERSION } from "@/lib/legal";

export const metadata: Metadata = { title: "Shipping Policy" };

export default function ShippingPage() {
  const operator = getLegalOperator();
  return <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6"><article className="dashboard-panel prose-policy"><p className="eyebrow">Commerce</p><h1>Shipping Policy</h1><p>Policy version: {SHIPPING_POLICY_VERSION}</p><section><h2>Coverage</h2><p>Shipping is offered only to serviceable Indian postal codes shown as eligible during checkout. Products, plants, chemicals and devices may have location-specific restrictions.</p></section><section><h2>Processing</h2><p>Paid orders normally move to processing after inventory reservation and payment confirmation. Shipment creation is performed through the configured fulfilment provider. Processing and delivery estimates shown in the order view are estimates, not guarantees.</p></section><section><h2>Address and delivery</h2><p>The customer must provide a complete name, phone number, address, city, state and six-digit PIN code. Failed delivery caused by inaccurate information may result in return charges where lawful. Do not accept a visibly damaged package without recording evidence.</p></section><section><h2>Tracking and exceptions</h2><p>Tracking events are supplied by Shiprocket and courier partners. Delays can result from weather, public holidays, remote-area service, regulation, carrier capacity or address verification. Contact {operator.supportEmail} with the order number for help.</p></section></article></main>;
}
