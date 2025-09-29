
"use client";

import { useMemo } from "react";
import { useCollection, useFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { startOfDay, endOfDay } from "date-fns";
import { DateSwitcher } from "@/components/dashboard/date-switcher";
import type { MealLog, Expense } from "@/lib/types";
import { Utensils, ShoppingCart } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

interface DailySummaryProps {
    userId: string;
    groupId: string;
    selectedDate: Date;
    onDateChange: (date: Date) => void;
}

export function DailySummary({ userId, groupId, selectedDate, onDateChange }: DailySummaryProps) {
    const { firestore } = useFirebase();

    const dateRange = useMemo(() => {
        return {
          start: startOfDay(selectedDate),
          end: endOfDay(selectedDate),
        };
    }, [selectedDate]);

    const mealsQuery = useMemo(() => {
        if (!userId || !groupId) return null;
        return query(
            collection(firestore, `groups/${groupId}/meals`),
            where("userId", "==", userId),
            where("date", ">=", dateRange.start),
            where("date", "<=", dateRange.end)
        )
    }, [firestore, groupId, userId, dateRange]
    );

    const expensesQuery = useMemo(() => {
        if (!userId || !groupId) return null;
        return query(
            collection(firestore, `groups/${groupId}/expenses`),
            where("userId", "==", userId),
            where("date", ">=", dateRange.start),
            where("date", "<=", dateRange.end)
        )
    }, [firestore, groupId, userId, dateRange]
    );
    
    const { data: mealsData, isLoading: areMealsLoading } = useCollection<MealLog>(mealsQuery);
    const { data: expensesData, isLoading: areExpensesLoading } = useCollection<Expense>(expensesQuery);
    
    const { totalMeals, totalFoodExpense } = useMemo(() => {
        const meals = mealsData?.reduce((sum, meal) => sum + (meal.mealNumber || 1), 0) || 0;
        const foodExpense = expensesData?.filter(e => e.category === 'Food & Groceries').reduce((sum, e) => sum + e.amount, 0) || 0;
        return { totalMeals: meals, totalFoodExpense: foodExpense };
    }, [mealsData, expensesData]);

    const isLoading = areMealsLoading || areExpensesLoading;

    return (
        <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                 <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline">
                    Dashboard
                    </h1>
                    <p className="text-muted-foreground">
                    Log your meals and expenses for the day.
                    </p>
                </div>
                 <DateSwitcher currentDate={selectedDate} onDateChange={onDateChange} />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 text-center">
                 {isLoading ? (
                    <>
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </>
                 ) : (
                    <>
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <div className="flex items-center justify-center gap-2 mb-1 text-muted-foreground">
                                <Utensils className="h-4 w-4" />
                                <p className="text-sm">Meals Logged Today</p>
                            </div>
                            <p className="text-3xl font-bold">{totalMeals}</p>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <div className="flex items-center justify-center gap-2 mb-1 text-muted-foreground">
                                <ShoppingCart className="h-4 w-4" />
                                <p className="text-sm">Food Expenses Today</p>
                            </div>
                            <p className="text-3xl font-bold">৳{totalFoodExpense.toFixed(0)}</p>
                        </div>
                    </>
                 )}
            </div>
        </div>
    );
}
