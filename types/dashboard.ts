import type { Plant, Reminder } from "@/types/app";
import type { SavedAnalysis } from "@/types/analysis";

export type DashboardSummary = {
  plants: Plant[];
  analyses: SavedAnalysis[];
  reminders: Reminder[];
  stats: {
    plantCount: number;
    needAttention: number;
    scansThisWeek: number;
    healthScore: number;
  };
};
