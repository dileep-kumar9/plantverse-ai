import type { Metadata } from "next";

import { COOKIE_VERSION, getLegalOperator } from "@/lib/legal";

export const metadata: Metadata = { title: "Cookie and Analytics Choices" };

export default function CookiesPage() {
  const operator = getLegalOperator();
  return <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6"><article className="dashboard-panel prose-policy"><p className="eyebrow">Privacy controls</p><h1>Cookie and Analytics Choices</h1><p>Policy version: {COOKIE_VERSION}</p><section><h2>Essential storage</h2><p>PlantVerse uses an HTTP-only authentication session cookie and local preferences required for sign-in, security, theme and service operation. These cannot be disabled while using authenticated features.</p></section><section><h2>Optional analytics</h2><p>Google Analytics is loaded only after the user chooses analytics consent. Advertising storage and personalized advertising are disabled. Consent can be withdrawn from Settings or by clearing the <code>plantverse-analytics-consent</code> preference.</p></section><section><h2>Push notifications</h2><p>Browser notification permission and Firebase messaging tokens are created only after a user enables push notifications. Permission can be revoked in browser settings and tokens can be removed from PlantVerse settings.</p></section><section><h2>Contact</h2><p>Questions about tracking choices can be sent to {operator.privacyEmail}.</p></section></article></main>;
}
