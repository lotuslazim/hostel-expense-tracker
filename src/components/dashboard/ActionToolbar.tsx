
"use client";

import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { LogMealDialog } from "./LogMealDialog";
import { AddExpenseDialog } from "./AddExpenseDialog";

interface ActionToolbarProps {
  onLogMealClick: () => void;
  onAddExpenseClick: () => void;
  isLogMealOpen: boolean;
  setIsLogMealOpen: (isOpen: boolean) => void;
  isAddExpenseOpen: boolean;
  setIsAddExpenseOpen: (isOpen: boolean) => void;
}

export function ActionToolbar({
  onLogMealClick,
  onAddExpenseClick,
  isLogMealOpen,
  setIsLogMealOpen,
  isAddExpenseOpen,
  setIsAddExpenseOpen,
}: ActionToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Dashboard</h1>
        <p className="text-muted-foreground">Log your meals and expenses for the day.</p>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={onLogMealClick}>
          <PlusCircle className="mr-2 h-4 w-4" /> Log Meal
        </Button>
        <Button variant="outline" onClick={onAddExpenseClick}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
        </Button>

        <LogMealDialog isOpen={isLogMealOpen} setIsOpen={setIsLogMealOpen} />
        <AddExpenseDialog isOpen={isAddExpenseOpen} setIsOpen={setIsAddExpenseOpen} />
      </div>
    </div>
  );
}
