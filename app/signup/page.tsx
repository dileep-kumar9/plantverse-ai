"use client";

import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  updateProfile,
} from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { getFirebaseAuth } from "@/lib/firebase/client";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (name.trim().length < 2) return setError("Enter your name.");
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      return setError("Use at least 8 characters with a letter and a number.");
    }
    if (password !== confirmPassword) return setError("Passwords do not match.");
    if (!acceptedLegal) return setError("Accept the Terms and Privacy Policy.");

    setBusy(true);
    try {
      const auth = getFirebaseAuth();
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(credential.user, { displayName: name.trim() });
      const idToken = await credential.user.getIdToken(true);
      const consentResponse = await fetch("/api/auth/consent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ idToken, acceptedLegal: true }),
      });
      if (!consentResponse.ok) {
        const payload = (await consentResponse.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Unable to record legal consent.");
      }
      const appUrl = window.location.origin;
      await sendEmailVerification(credential.user, {
        url: `${appUrl}/login?verified=1`,
        handleCodeInApp: false,
      });
      await signOut(auth);
      router.push(`/verify-email?email=${encodeURIComponent(email.trim())}`);
    } catch (requestError) {
      const code = String((requestError as { code?: string }).code ?? "");
      if (code.includes("email-already-in-use")) setError("An account already exists for this email.");
      else setError(requestError instanceof Error ? requestError.message : "Unable to create account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-10 sm:py-16">
      <section className="rounded-[2rem] border border-[var(--border-color)] bg-[var(--surface-primary)] p-6 shadow-[var(--shadow-lg)] sm:p-10">
        <p className="eyebrow">Private cloud account</p>
        <h1 className="mt-2 text-3xl font-semibold">Create your PlantVerse account</h1>
        <form onSubmit={submit} className="mt-7 space-y-4">
          <label className="block text-sm font-medium">Name<input required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className="mt-2 min-h-12 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--surface-secondary)] px-4" /></label>
          <label className="block text-sm font-medium">Email<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 min-h-12 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--surface-secondary)] px-4" /></label>
          <label className="block text-sm font-medium">Password<input required type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 min-h-12 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--surface-secondary)] px-4" /></label>
          <label className="block text-sm font-medium">Confirm password<input required type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-2 min-h-12 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--surface-secondary)] px-4" /></label>
          <label className="flex gap-3 text-sm text-[var(--text-secondary)]">
            <input type="checkbox" required checked={acceptedLegal} onChange={(event) => setAcceptedLegal(event.target.checked)} />
            <span>I accept the <Link href="/terms" className="underline">Terms</Link> and acknowledge the <Link href="/privacy" className="underline">Privacy Policy</Link>.</span>
          </label>
          {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
          <button disabled={busy} className="voice-button w-full disabled:opacity-60">{busy ? "Creating account…" : "Create account"}</button>
        </form>
        <p className="mt-5 text-center text-sm text-[var(--text-secondary)]">Already registered? <Link href="/login" className="text-[var(--brand-primary)]">Sign in</Link></p>
      </section>
    </main>
  );
}
