
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Utensils, CreditCard, ShoppingCart } from "lucide-react";
import type { Meal, Expense, Item } from "@/lib/types";

interface DailyTrackerCardProps {
  date: Date;
  meals: Meal[];
  expenses: Expense[];
  items: Item[];
}

export function DailyTrackerCard({ date, meals, expenses, items }: DailyTrackerCardProps) {
  const dayMeals = meals.filter(m => new Date(m.loggedAt).toDateString() === date.toDateString());
  const dayExpenses = expenses.filter(e => new Date(e.date).toDateString() === date.toDateString());
  const dayItems = items.filter(i => new Date(i.date).toDateString() === date.toDateString());

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{date.getDate()}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        {dayMeals.length > 0 && (
            <div className="flex items-center gap-1.5">
                <Utensils className="h-3 w-3 text-muted-foreground" />
                <span>{dayMeals.length} meal(s)</span>
            </div>
        )}
        {dayExpenses.length > 0 && (
             <div className="flex items-center gap-1.5">
                <CreditCard className="h-3 w-3 text-muted-foreground" />
                <span>{dayExpenses.length} expense(s)</span>
            </div>
        )}
        {dayItems.length > 0 && (
             <div className="flex items-center gap-1.5">
                <ShoppingCart className="h-3 w-3 text-muted-foreground" />
                <span>{dayItems.length} item(s)</span>
            </div>
        )}
        {dayMeals.length === 0 && dayExpenses.length === 0 && dayItems.length === 0 && (
            <p className="text-muted-foreground">No activity</p>
        )}
      </CardContent>
    </Card>
  );
}
