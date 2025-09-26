
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDaysInMonth } from "date-fns";

interface MonthlySummaryStatsProps {
    totalMeals: number;
    totalExpenses: number;
    month: Date;
}

export function MonthlySummaryStats({ totalMeals, totalExpenses, month }: MonthlySummaryStatsProps) {
    const daysInMonth = getDaysInMonth(month);
    const averageMealsPerDay = totalMeals > 0 ? (totalMeals / daysInMonth).toFixed(1) : 0;
    const averageDailyExpense = totalExpenses > 0 ? (totalExpenses / daysInMonth).toFixed(2) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Summary</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">Total Meals</p>
          <p className="text-2xl font-bold">{totalMeals}</p>
        </div>
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">Total Expenses</p>
          <p className="text-2xl font-bold">Tk{totalExpenses.toLocaleString()}</p>
        </div>
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">Avg. Meals/Day</p>
          <p className="text-2xl font-bold">{averageMealsPerDay}</p>
        </div>
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">Avg. Daily Expense</p>
          <p className="text-2xl font-bold">Tk{averageDailyExpense}</p>
        </div>
      </CardContent>
    </Card>
  );
}
