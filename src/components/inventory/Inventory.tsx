"use client";

import { InventoryTable } from "./InventoryTable";

export function Inventory() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Inventory</h1>
      <InventoryTable purchases={[]} isLoading={false} />
    </div>
  );
}
