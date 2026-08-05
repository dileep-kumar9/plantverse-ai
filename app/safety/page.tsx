import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "AI & Plant Safety" };

export default function SafetyPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <article className="dashboard-panel prose-policy">
        <p className="eyebrow">Responsible use</p>
        <h1 className="mt-3 text-3xl font-semibold">AI & Plant Safety</h1>
        <p className="mt-4 leading-7 text-[var(--text-secondary)]">PlantVerse analyzes visible evidence and user context. It cannot confirm every disease, nutrient deficiency, chemical exposure, pest or soil condition from a photo.</p>
        <section><h2>Before treatment</h2><p>Use clear evidence, review confidence and evidence-needed fields, compare symptoms over time, and seek local expert or laboratory confirmation when a crop, valuable plant, food safety, animal safety or significant financial decision is involved.</p></section>
        <section><h2>Chemicals</h2><p>Never mix chemicals or exceed label directions based only on an AI answer. Verify that the product is legal for the plant, pest, crop stage and location. Wear required protective equipment and keep products away from children, animals, water sources and food.</p></section>
        <section><h2>Soil and moisture</h2><p>A photograph cannot measure exact pH, nutrient concentration or moisture. Use a calibrated meter or laboratory test where precision matters. Device readings are only as reliable as the device, calibration and sampling method.</p></section>
        <section><h2>Urgent hazards</h2><p>Stop using the app as the primary source and contact qualified local services for suspected poisoning, dangerous chemical exposure, electrical hazards, severe allergic reactions, toxic plants consumed by people or animals, or regulated invasive pests.</p></section>
        <section><h2>Community</h2><p>Do not share personal contact information. Report dangerous, abusive or misleading posts. Community answers are user-generated and are not automatically verified expert advice.</p></section>
        <div className="mt-8 flex flex-wrap gap-4 text-sm"><Link href="/privacy" className="font-semibold text-[var(--brand-primary)]">Privacy Policy</Link><Link href="/terms" className="font-semibold text-[var(--brand-primary)]">Terms of Service</Link></div>
      </article>
    </main>
  );
}
