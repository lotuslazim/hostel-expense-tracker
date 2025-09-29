
"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { eachDayOfInterval, startOfMonth, endOfMonth, format } from "date-fns";
import type { MealLog, Expense } from "@/lib/types";

interface MonthlyOverviewChartProps {
  meals: MealLog[];
  expenses: Expense[];
}

export function MonthlyOverviewChart({ meals, expenses }: MonthlyOverviewChartProps) {
  const chartData = useMemo(() => {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return daysInMonth.map(day => {
      const formattedDay = format(day, "yyyy-MM-dd");
      
      const dailyMeals = meals
        .filter(meal => format( (meal.date as any).toDate(), "yyyy-MM-dd") === formattedDay)
        .reduce((sum, meal) => sum + meal.mealNumber, 0);

      const dailyExpenses = expenses
        .filter(expense => format( (expense.date as any).toDate(), "yyyy-MM-dd") === formattedDay)
        .reduce((sum, expense) => sum + expense.amount, 0);

      return {
        date: format(day, "MMM d"),
        Meals: dailyMeals,
        Expenses: dailyExpenses,
      };
    });
  }, [meals, expenses]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>This Month's Activity</CardTitle>
        <CardDescription>A summary of meals and expenses logged this month.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
            <XAxis
              dataKey="date"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="left"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
              label={{ value: 'Meals', angle: -90, position: 'insideLeft', fill: 'hsl(var(--foreground))' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `৳${value}`}
               label={{ value: 'Expenses (৳)', angle: 90, position: 'insideRight', fill: 'hsl(var(--foreground))' }}
            />
            <Tooltip
                contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    borderColor: "hsl(var(--border))"
                }}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="Meals" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="right" dataKey="Expenses" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
