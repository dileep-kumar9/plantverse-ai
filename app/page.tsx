import DashboardHero from "@/components/dashboard/DashboardHero";
import GardenHealth from "@/components/dashboard/GardenHealth";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentPlants from "@/components/dashboard/RecentPlants";
import AITips from "@/components/dashboard/AITips";
import FloatingCopilot from "@/components/dashboard/FloatingCopilot";

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--app-background)]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        <DashboardHero />

        <GardenHealth />

        <QuickActions />

        <RecentPlants />

        <AITips />

      </div>

      <FloatingCopilot />
    </main>
  );
}