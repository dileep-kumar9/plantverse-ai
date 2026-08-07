"use client";

import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { getFirebaseAuth } from "@/lib/firebase/client";

function GoogleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.98-.9 6.64-2.36l-3.24-2.54c-.9.6-2.05.96-3.4.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.39 13.93A6.02 6.02 0 0 1 6.08 12c0-.67.11-1.32.31-1.93V7.45H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.55l3.35-2.62Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.94c1.47 0 2.79.51 3.83 1.5l2.88-2.88A9.66 9.66 0 0 0 12 2a10 10 0 0 0-8.96 5.45l3.35 2.62C7.18 7.7 9.39 5.94 12 5.94Z"
      />
    </svg>
  );
}

function authMessage(error: unknown): string {
  const code = String((error as { code?: string }).code ?? "");

  if (
    code.includes("invalid-credential") ||
    code.includes("wrong-password")
  ) {
    return "The email or password is incorrect.";
  }

  if (code.includes("too-many-requests")) {
    return "Too many attempts. Please wait and try again.";
  }

  if (code.includes("popup-closed")) {
    return "Google sign-in was cancelled.";
  }

  return error instanceof Error ? error.message : "Unable to sign in.";
}

export default function LoginPage() {
  const router = useRouter();
  const { establishSession } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedGoogleLegal, setAcceptedGoogleLegal] = useState(false);
  const [legacyConsent, setLegacyConsent] = useState(false);
  const [needsConsent, setNeedsConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function finish() {
    const next = new URLSearchParams(window.location.search).get("next");

    router.replace(
      next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard",
    );

    router.refresh();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setBusy(true);
    setError("");

    try {
      const credential = await signInWithEmailAndPassword(
        getFirebaseAuth(),
        email.trim(),
        password,
      );

      if (!credential.user.emailVerified) {
        router.push("/verify-email");
        return;
      }

      try {
        await establishSession(
          credential.user,
          needsConsent ? legacyConsent : false,
        );
      } catch (sessionError) {
        if (
          (sessionError as { code?: string }).code ===
          "CONSENT_REQUIRED"
        ) {
          setNeedsConsent(true);

          throw new Error(
            "This account needs your Terms and Privacy consent before continuing.",
          );
        }

        throw sessionError;
      }

      finish();
    } catch (requestError) {
      setError(authMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  async function googleSignIn() {
    if (!acceptedGoogleLegal) {
      setError(
        "Accept the Terms and Privacy Policy before using Google sign-in.",
      );
      return;
    }

    setBusy(true);
    setError("");

    try {
      const provider = new GoogleAuthProvider();

      provider.setCustomParameters({
        prompt: "select_account",
      });

      const credential = await signInWithPopup(
        getFirebaseAuth(),
        provider,
      );

      await establishSession(credential.user, true);

      finish();
    } catch (requestError) {
      setError(authMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl place-items-center px-4 py-10">
      <section className="grid w-full overflow-hidden rounded-[2rem] border border-[var(--border-color)] bg-[var(--surface-primary)] shadow-[var(--shadow-lg)] lg:grid-cols-[.9fr_1.1fr]">
        <div className="bg-gradient-to-br from-green-950 via-green-800 to-green-600 p-8 text-white sm:p-12">
          <div className="text-5xl">🌿</div>

          <h1 className="mt-6 text-4xl font-semibold">
            Welcome back
          </h1>

          <p className="mt-4 max-w-md leading-7 text-white/80">
            Sign in to your private Plant Memory, reminders, devices,
            community and order history.
          </p>
        </div>

        <div className="p-6 sm:p-10">
          <h2 className="text-2xl font-semibold">
            Sign in to PlantVerse
          </h2>

          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Use your verified email or Google account.
          </p>

          <button
            type="button"
            disabled={busy || !acceptedGoogleLegal}
            onClick={() => void googleSignIn()}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl border border-[var(--border-color)] px-4 py-3 font-semibold transition hover:bg-[var(--surface-secondary)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <GoogleIcon />

            <span>
              {busy ? "Please wait…" : "Continue with Google"}
            </span>
          </button>

          <label className="mt-3 flex gap-3 text-xs text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={acceptedGoogleLegal}
              onChange={(event) =>
                setAcceptedGoogleLegal(event.target.checked)
              }
            />

            <span>
              For Google sign-in, I explicitly accept the{" "}
              <Link href="/terms" className="underline">
                Terms
              </Link>{" "}
              and acknowledge the{" "}
              <Link href="/privacy" className="underline">
                Privacy Policy
              </Link>
              .
            </span>
          </label>

          <div className="my-6 flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
            <span className="h-px flex-1 bg-[var(--border-color)]" />

            <span>OR</span>

            <span className="h-px flex-1 bg-[var(--border-color)]" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            <label className="block text-sm font-medium">
              Email

              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--surface-secondary)] px-4 outline-none focus:border-[var(--brand-primary)]"
              />
            </label>

            <label className="block text-sm font-medium">
              Password

              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--surface-secondary)] px-4 outline-none focus:border-[var(--brand-primary)]"
              />
            </label>

            {needsConsent ? (
              <label className="flex gap-3 text-sm text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  required
                  checked={legacyConsent}
                  onChange={(event) =>
                    setLegacyConsent(event.target.checked)
                  }
                />

                <span>
                  I accept the{" "}
                  <Link href="/terms" className="underline">
                    Terms
                  </Link>{" "}
                  and acknowledge the{" "}
                  <Link href="/privacy" className="underline">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
            ) : null}

            {error ? (
              <div
                role="alert"
                className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
              >
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              className="voice-button w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-5 flex flex-wrap justify-between gap-3 text-sm">
            <Link
              href="/forgot-password"
              className="text-[var(--brand-primary)]"
            >
              Forgot password?
            </Link>

            <Link
              href="/signup"
              className="text-[var(--brand-primary)]"
            >
              Create account
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}