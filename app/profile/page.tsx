"use client";

import { FormEvent, useEffect, useState } from "react";
import { getIdToken } from "firebase/auth";
import { useAuth } from "@/components/auth/AuthProvider";
import PageIntro from "@/components/shared/PageIntro";
import { useCollection } from "@/hooks/useCollection";
import { apiFetch } from "@/lib/client-api";
import type { UserProfile } from "@/types/app";

const spaces = ["Pots", "Terrace", "Backyard", "Field", "Indoor", "Balcony"];

export default function ProfilePage() {
  const { user, firebaseUser, logout } = useAuth();
  const { items, loading, create, update } = useCollection<UserProfile>("profile");
  const profile = items.find((item) => item.id === "main");
  const [displayName, setDisplayName] = useState("");
  const [expertise, setExpertise] = useState<UserProfile["expertise"]>("home-grower");
  const [growingSpaces, setGrowingSpaces] = useState<string[]>([]);
  const [locationName, setLocationName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [deleteText, setDeleteText] = useState("");

  useEffect(() => {
    if (!profile) {
      setDisplayName(user?.name || "");
      return;
    }
    setDisplayName(profile.displayName || user?.name || "");
    setExpertise(profile.expertise || "home-grower");
    setGrowingSpaces(profile.growingSpaces || []);
    setLocationName(profile.locationName || "");
  }, [profile, user?.name]);

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const payload = {
      displayName: displayName.trim(),
      expertise,
      growingSpaces,
      locationName: locationName.trim(),
      createdAt: profile?.createdAt || new Date().toISOString(),
    };
    try {
      if (profile) await update("main", payload);
      else await create({ id: "main", ...payload });
      setMessage("Profile saved.");
    } finally {
      setBusy(false);
    }
  }

  function toggleSpace(space: string) {
    setGrowingSpaces((current) => current.includes(space) ? current.filter((item) => item !== space) : [...current, space]);
  }

  async function deleteAccount() {
    if (deleteText !== "DELETE MY ACCOUNT") return;
    if (!firebaseUser) {
      setMessage("Sign in again before deleting your account.");
      return;
    }
    if (!window.confirm("Permanently delete your PlantVerse account and eligible saved data? Order records may be anonymized where legal retention is required.")) return;
    setBusy(true);
    try {
      const idToken = await getIdToken(firebaseUser, true);
      await apiFetch("/api/account", {
        method: "DELETE",
        body: JSON.stringify({ idToken, confirmation: "DELETE MY ACCOUNT" }),
      });
      await logout();
      window.location.assign("/login?deleted=1");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to delete account.");
      setBusy(false);
    }
  }

  function exportAccount() {
    window.location.assign("/api/account/export");
  }

  const initial = (displayName || user?.name || user?.email || "P").charAt(0).toUpperCase();
  return (
    <main className="page-wrap">
      <PageIntro eyebrow="Account" title={displayName || user?.name || "Your profile"} description="Manage your private PlantVerse identity, growing interests, and account data." />
      <form onSubmit={save} className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="dashboard-panel">
          <div className="flex items-center gap-4">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-[var(--brand-soft)] text-3xl font-semibold text-[var(--brand-primary)]">{initial}</div>
            <div><h2 className="text-xl font-semibold">{user?.email}</h2><p className="text-[var(--text-secondary)]">Secure account</p></div>
          </div>
          <label className="mt-6 block text-sm font-medium">Display name<input required maxLength={80} value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="mt-2 w-full rounded-2xl border p-3" /></label>
          <label className="mt-5 block text-sm font-medium">Experience level<select value={expertise} onChange={(event) => setExpertise(event.target.value as UserProfile["expertise"])} className="mt-2 w-full rounded-2xl border p-3"><option value="beginner">Beginner</option><option value="home-grower">Home grower</option><option value="farmer">Farmer</option><option value="expert">Expert</option></select></label>
          <label className="mt-5 block text-sm font-medium">Location label<input maxLength={100} value={locationName} onChange={(event) => setLocationName(event.target.value)} className="mt-2 w-full rounded-2xl border p-3" placeholder="Hyderabad, Telangana" /></label>
        </section>
        <section className="dashboard-panel">
          <h2 className="font-semibold">Growing spaces</h2>
          <div className="mt-4 flex flex-wrap gap-2">{spaces.map((space) => <button key={space} type="button" onClick={() => toggleSpace(space)} className={growingSpaces.includes(space) ? "voice-button" : "outline-button"}>{space}</button>)}</div>
          <button disabled={busy || loading} className="voice-button mt-8">{busy ? "Saving…" : "Save profile"}</button>
          {message ? <p className="mt-3 text-sm text-[var(--text-secondary)]">{message}</p> : null}
        </section>
      </form>

      <section className="dashboard-panel mt-8">
        <h2 className="text-xl font-semibold">Export your data</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">Download a JSON copy of your profile, scans, plants, reminders, settings, orders, notifications, chats and device readings.</p>
        <button type="button" onClick={exportAccount} className="outline-button mt-4">Download account export</button>
      </section>

      <section className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950">
        <h2 className="text-xl font-semibold text-red-800 dark:text-red-200">Delete account</h2>
        <p className="mt-2 text-sm text-red-700 dark:text-red-300">This permanently removes eligible account data. Order records may be anonymized and retained where required for payment, tax, fraud, refund or consumer-law obligations.</p>
        <input value={deleteText} onChange={(event) => setDeleteText(event.target.value)} className="mt-4 rounded-2xl border border-red-300 bg-white p-3 text-gray-900" placeholder="Type DELETE MY ACCOUNT" />
        <button type="button" disabled={deleteText !== "DELETE MY ACCOUNT" || busy} onClick={() => void deleteAccount()} className="outline-button ml-3 border-red-300 text-red-700 disabled:opacity-50">Delete permanently</button>
      </section>
    </main>
  );
}
