
"use client";

import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { Meal, Expense, Item } from "@/lib/types";
import { DailyTrackerCard } from "./daily-tracker";
import { cn } from "@/lib/utils";

interface MonthlyCalendarProps {
  currentDate: Date;
  meals: Meal[];
  expenses: Expense[];
  items: Item[];
}

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function MonthlyCalendar({
  currentDate,
  meals,
  expenses,
  items,
}: MonthlyCalendarProps) {
  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);

  const daysInMonth = eachDayOfInterval({
    start: startOfWeek(firstDayOfMonth),
    end: endOfWeek(lastDayOfMonth),
  });

  return (
    <div className="grid grid-cols-7 gap-2">
      {WEEK_DAYS.map((day) => (
        <div key={day} className="text-center font-semibold text-muted-foreground text-sm">
          {day}
        </div>
      ))}
      {daysInMonth.map((day, index) => (
        <div
          key={index}
          className={cn(
            "h-32 rounded-lg",
            !isSameMonth(day, currentDate) && "opacity-50"
          )}
        >
          <DailyTrackerCard
            date={day}
            meals={meals}
            expenses={expenses}
            items={items}
          />
        </div>
      ))}
    </div>
  );
}
