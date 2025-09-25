"use client";

import { DailyTracker } from "@/components/dashboard/daily-tracker";
import { DateSwitcher } from "@/components/dashboard/date-switcher";
import { MOCK_EXPENSES, MOCK_ITEMS, MOCK_MEALS } from "@/lib/data";
import { format } from "date-fns";
import { useState } from "react";
import type { Item, Meal, Expense } from "@/lib/types";

export default function DashboardPage({
  searchParams,
}: {
  searchParams?: { date?: string };
}) {
  const selectedDate = searchParams?.date ? new Date(searchParams.date) : new Date();

  // In a real app, you would fetch this data based on the selectedDate
  const [meals, setMeals] = useState<Meal[]>(MOCK_MEALS);
  const [expenses, setExpenses] = useState<Expense[]>(MOCK_EXPENSES);
  const [items, setItems] = useState<Item[]>(MOCK_ITEMS);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Dashboard</h1>
          <p className="text-muted-foreground">
            {selectedDate ? `Logs for ${format(selectedDate, "eeee, MMMM d, yyyy")}` : "Select a date to view logs"}
          </p>
        </div>
        <DateSwitcher currentDate={selectedDate} />
      </div>
      <div className="bg-accent/20 border border-accent/30 text-accent-foreground p-4 rounded-lg">
        <h3 className="font-bold">Reminder</h3>
        <p className="text-sm">You forgot to log your meals yesterday. Catch up now!</p>
      </div>
      <DailyTracker
        meals={meals}
        items={items}
        expenses={expenses}
        onSetItems={setItems}
      />
    </div>
  );
}
