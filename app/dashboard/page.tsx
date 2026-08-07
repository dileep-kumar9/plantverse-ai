import AITips from "@/components/dashboard/AITips";
import DashboardDataProvider from "@/components/dashboard/DashboardDataProvider";
import DashboardHero from "@/components/dashboard/DashboardHero";
import GardenHealth from "@/components/dashboard/GardenHealth";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentActivity from "@/components/dashboard/RecentActivity";
import RecentPlants from "@/components/dashboard/RecentPlants";
import SearchBar from "@/components/dashboard/SearchBar";
import TaskList from "@/components/dashboard/TaskList";
import WeatherWidget from "@/components/dashboard/WeatherWidget";

export default function DashboardPage() {
  return (
    <DashboardDataProvider>
      <main className="min-h-screen bg-[var(--app-background)]">
        <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
          <SearchBar />

          <div className="mt-4 sm:mt-6">
            <DashboardHero />
          </div>

          <section className="mt-5 grid items-stretch gap-4 sm:mt-7 lg:grid-cols-2 lg:gap-6">
            <WeatherWidget />
            <GardenHealth />
          </section>

          <QuickActions />

          <section className="mt-7 grid items-stretch gap-4 sm:mt-9 lg:grid-cols-2 lg:gap-6">
            <TaskList />
            <RecentActivity />
          </section>

          <RecentPlants />
          <AITips />
        </div>
      </main>
    </DashboardDataProvider>
  );
}
