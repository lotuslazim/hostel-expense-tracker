
"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { DateSwitcher } from "@/components/dashboard/date-switcher";
import { MealLog } from "@/components/dashboard/meal-log";
import { ExpenseLog } from "@/components/dashboard/expense-log";
import { ItemLog } from "@/components/dashboard/item-log";
import type { Meal, Expense, Item } from "@/lib/types";
import { MOCK_EXPENSES, MOCK_ITEMS, MOCK_MEALS } from "@/lib/data";

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");

  // If date param exists, parse it. Otherwise, use today.
  const initialDate = dateParam ? parseISO(dateParam) : new Date();
  const [currentDate, setCurrentDate] = useState(initialDate);

  // In a real app, you would fetch this data based on the selected date
  const [meals, setMeals] = useState<Meal[]>(MOCK_MEALS);
  const [expenses, setExpenses] = useState<Expense[]>(MOCK_EXPENSES);
  const [items, setItems] = useState<Item[]>(MOCK_ITEMS);
  
  // Filter data for the current date
  const dailyMeals = meals.filter(m => format(m.loggedAt, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd'));
  const dailyExpenses = expenses.filter(e => format(e.date, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd'));
  const dailyItems = items.filter(i => format(i.date, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd'));


  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Daily Tracker
          </h1>
          <p className="text-muted-foreground">
            Log your meals, expenses, and purchased items for{" "}
            {format(currentDate, "MMMM d, yyyy")}.
          </p>
        </div>
        <DateSwitcher currentDate={currentDate} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <MealLog meals={dailyMeals} />
        <div className="space-y-8">
          <ExpenseLog expenses={dailyExpenses} />
          <ItemLog items={dailyItems} onSetItems={setItems} />
        </div>
      </div>
    </div>
  );
}
