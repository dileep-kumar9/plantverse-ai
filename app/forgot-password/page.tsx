"use client";

import { sendPasswordResetEmail } from "firebase/auth";
import Link from "next/link";
import { FormEvent, useState } from "react";

import { getFirebaseAuth } from "@/lib/firebase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email.trim(), {
        url: `${window.location.origin}/login`,
      });
    } catch {
      // Keep the response identical to reduce account enumeration.
    } finally {
      setMessage("If an account exists, Firebase has sent a password reset email.");
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <section className="dashboard-panel">
        <h1 className="text-3xl font-semibold">Reset your password</h1>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">Enter your account email. The reset link is handled by Firebase Authentication.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="min-h-12 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--surface-secondary)] px-4" placeholder="Email address" />
          <button disabled={busy} className="voice-button w-full">{busy ? "Sending…" : "Send reset email"}</button>
        </form>
        {message ? <p className="mt-4 rounded-2xl bg-[var(--brand-soft)] p-4 text-sm">{message}</p> : null}
        <Link href="/login" className="mt-5 inline-block text-sm text-[var(--brand-primary)]">Back to sign in</Link>
      </section>
    </main>
  );
}
