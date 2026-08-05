import { NextRequest, NextResponse } from "next/server";
import { listDocuments } from "@/lib/firebase-admin-rest";
import { enforceRateLimit } from "@/lib/rate-limit";
import { requireUser } from "@/lib/server/require-user";
import type { Plant, Reminder } from "@/types/app";
import type { SavedAnalysis } from "@/types/analysis";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    await enforceRateLimit(request, "dashboard", 120, 60, user.sub);
    const [plants, analyses, reminders] = await Promise.all([
      listDocuments<Plant>(`users/${user.sub}/plants`, 100),
      listDocuments<SavedAnalysis>(`users/${user.sub}/analyses`, 100),
      listDocuments<Reminder>(`users/${user.sub}/reminders`, 100),
    ]);
    const sortedPlants = [...plants].sort((a, b) => String(b.updatedAt ?? b.createdAt ?? "").localeCompare(String(a.updatedAt ?? a.createdAt ?? "")));
    const sortedAnalyses = [...analyses].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const sortedReminders = [...reminders]
      .filter((item) => !item.done)
      .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
    const healthValues = sortedPlants.length
      ? sortedPlants.map((plant) => Number(plant.health) || 0)
      : sortedAnalyses.map((analysis) => Number(analysis.healthScore) || 0);
    const healthScore = healthValues.length
      ? Math.round(healthValues.reduce((sum, value) => sum + value, 0) / healthValues.length)
      : 0;
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return NextResponse.json({
      plants: sortedPlants.slice(0, 6),
      analyses: sortedAnalyses.slice(0, 6),
      reminders: sortedReminders.slice(0, 6),
      stats: {
        plantCount: sortedPlants.length,
        needAttention: sortedPlants.filter((plant) => Number(plant.health) < 70).length,
        scansThisWeek: sortedAnalyses.filter((analysis) => new Date(analysis.createdAt).getTime() >= weekAgo).length,
        healthScore,
      },
    });
  } catch (error) {
    const status = Number((error as { status?: number }).status ?? 500);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load dashboard." }, { status });
  }
}
