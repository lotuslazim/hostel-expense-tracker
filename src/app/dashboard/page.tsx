import { Dashboard } from "@/components/dashboard/Dashboard";
import { AppHeader } from "@/components/app/header";

export default function DashboardPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Dashboard />
      </main>
    </div>
  );
}
