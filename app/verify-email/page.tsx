"use client";

import { sendEmailVerification } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { firebaseUser, establishSession } = useAuth();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function check() {
    if (!firebaseUser) {
      router.push("/login");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await firebaseUser.reload();
      if (!firebaseUser.emailVerified) {
        setMessage("The email is not verified yet. Open the Firebase email and click the verification link.");
        return;
      }
      await establishSession(firebaseUser, false);
      router.replace("/");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to verify the account.");
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    if (!firebaseUser) {
      setMessage("Sign in again to resend verification.");
      return;
    }
    setBusy(true);
    try {
      await sendEmailVerification(firebaseUser, { url: `${window.location.origin}/login?verified=1` });
      setMessage("Verification email sent.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to resend verification.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <section className="dashboard-panel text-center">
        <div className="text-5xl">✉️</div>
        <h1 className="mt-5 text-3xl font-semibold">Verify your email</h1>
        <p className="mt-3 text-[var(--text-secondary)]">Check your inbox and spam folder. Email/password accounts must be verified before private cloud data is available.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button disabled={busy} onClick={() => void check()} className="voice-button">I verified my email</button>
          <button disabled={busy} onClick={() => void resend()} className="outline-button">Resend email</button>
        </div>
        {message ? <p className="mt-4 text-sm text-[var(--text-secondary)]">{message}</p> : null}
        <Link href="/login" className="mt-5 inline-block text-sm text-[var(--brand-primary)]">Back to sign in</Link>
      </section>
    </main>
  );
}
