"use client";

import Link from "next/link";
import { useDashboardData } from "@/components/dashboard/DashboardDataProvider";
import Card from "@/components/ui/Card";

export default function AITips() {
  const { data, loading } = useDashboardData();
  const latest = data.analyses[0];
  const title = latest ? `Advice for ${latest.plantName || "your latest scan"}` : "Build personalized care advice";
  const advice = latest?.wateringAdvice || latest?.prevention?.[0] || latest?.treatment?.[0]
    || "Scan a clear plant or soil image and save the report. PlantVerse will surface relevant care suggestions here.";

  return (
    <Card className="mt-10 bg-gradient-to-r from-green-700 to-green-500 text-white" aria-busy={loading}>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-white/75">AI care insight</p>
          <h2 className="mt-2 text-2xl font-bold">{loading ? "Loading your advice…" : title}</h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/90">{advice}</p>
          <p className="mt-3 text-xs text-white/70">AI results are informational. Confirm high-risk treatment decisions with a qualified local expert.</p>
        </div>
        <Link href={latest ? `/scan?report=${encodeURIComponent(latest.id)}` : "/scan"} className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-white/40 bg-white/10 px-5 text-sm font-semibold text-white transition hover:bg-white/20">
          {latest ? "Open report" : "Start a scan"}
        </Link>
      </div>
    </Card>
  );
}
