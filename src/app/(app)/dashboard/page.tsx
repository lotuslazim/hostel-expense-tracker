
"use client";

import { useState } from "react";
import { format, startOfMonth, addMonths, subMonths } from "date-fns";
import { MonthlyCalendar } from "@/components/dashboard/monthly-calendar";
import { MonthSwitcher } from "@/components/dashboard/month-switcher";
import { MonthlySummaryStats } from "@/components/dashboard/monthly-summary-stats";
import type { Meal, Expense, Item } from "@/lib/types";
import { MOCK_EXPENSES, MOCK_ITEMS, MOCK_MEALS } from "@/lib/data";

export default function DashboardPage() {
  const [currentDate, setCurrentDate] = useState(startOfMonth(new Date()));

  // In a real app, you would fetch this data based on the selected month
  const [meals, setMeals] = useState<Meal[]>(MOCK_MEALS);
  const [expenses, setExpenses] = useState<Expense[]>(MOCK_EXPENSES);
  const [items, setItems] = useState<Item[]>(MOCK_ITEMS);

  const handleMonthChange = (direction: "next" | "prev") => {
    if (direction === "next") {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };
  
  const monthlyTotals = {
    meals: 58, // Mock data
    expenses: 7500, // Mock data
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Monthly Overview
          </h1>
          <p className="text-muted-foreground">
            A calendar view of your meals and expenses for {format(currentDate, "MMMM yyyy")}.
          </p>
        </div>
        <MonthSwitcher
          currentDate={currentDate}
          onMonthChange={handleMonthChange}
        />
      </div>

      <MonthlyCalendar
        currentDate={currentDate}
        meals={meals}
        expenses={expenses}
        items={items}
      />
      
      <MonthlySummaryStats
        totalMeals={monthlyTotals.meals}
        totalExpenses={monthlyTotals.expenses}
        month={currentDate}
       />
    </div>
  );
}
