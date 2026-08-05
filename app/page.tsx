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

export default function Home() {
  return (
    <DashboardDataProvider>
      <main className="min-h-screen bg-[var(--app-background)]">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <SearchBar />
          <DashboardHero />
          <section className="mt-8 grid items-stretch gap-6 lg:grid-cols-2">
            <WeatherWidget />
            <GardenHealth />
          </section>
          <QuickActions />
          <section className="mt-10 grid items-stretch gap-6 lg:grid-cols-2">
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
