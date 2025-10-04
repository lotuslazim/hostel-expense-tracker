import { Inventory } from "@/components/inventory/Inventory";
import { AppHeader } from "@/components/app/header";

export default function InventoryPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Inventory />
      </main>
    </div>
  );
}
