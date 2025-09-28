
"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { format, parseISO, startOfDay, endOfDay } from "date-fns";
import { DateSwitcher } from "@/components/dashboard/date-switcher";
import { MealLog } from "@/components/dashboard/meal-log";
import { FoodExpenseLog } from "@/components/dashboard/food-expense-log";
import { UtilityExpenseLog } from "@/components/dashboard/utility-expense-log";
import type { Meal, Expense } from "@/lib/types";
import { useFirebase, useUser, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, where } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { WelcomeCard } from "@/components/app/welcome-card";

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-[240px]" />
            <Skeleton className="h-10 w-10" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Skeleton className="h-72 w-full rounded-lg" />
        <Skeleton className="h-72 w-full rounded-lg" />
        <Skeleton className="h-72 w-full rounded-lg" />
      </div>
    </div>
  );
}


export default function DashboardPage() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");
  const { firestore } = useFirebase();
  const { user: currentUser, isUserLoading: isCurrentUserLoading } = useUser();

  const initialDate = dateParam ? parseISO(dateParam) : new Date();
  const [currentDate, setCurrentDate] = useState(initialDate);

  const currentUserRef = useMemoFirebase(
    () => (currentUser ? doc(firestore, "users", currentUser.uid) : null),
    [firestore, currentUser]
  );
  const { data: currentUserData, isLoading: isCurrentUserDataLoading } =
    useDoc(currentUserRef);
  const groupId = currentUserData?.groupId;

  const dateRange = useMemo(() => {
    return {
      start: startOfDay(currentDate),
      end: endOfDay(currentDate),
    };
  }, [currentDate]);

  // Queries for meals and expenses
  const mealsQuery = useMemoFirebase(() =>
    groupId
      ? query(
          collection(firestore, `groups/${groupId}/meals`),
          where("date", ">=", dateRange.start),
          where("date", "<=", dateRange.end)
        )
      : null,
    [firestore, groupId, dateRange]
  );

  const expensesQuery = useMemoFirebase(() =>
    groupId
      ? query(
          collection(firestore, `groups/${groupId}/expenses`),
          where("date", ">=", dateRange.start),
          where("date", "<=", dateRange.end)
        )
      : null,
    [firestore, groupId, dateRange]
  );

  const { data: meals, isLoading: areMealsLoading } = useCollection<Meal>(mealsQuery);
  const { data: expenses, isLoading: areExpensesLoading } = useCollection<Expense>(expensesQuery);
  
  const isLoading = isCurrentUserLoading || isCurrentUserDataLoading || areMealsLoading || areExpensesLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }
  
  if (!groupId) {
    return <WelcomeCard />;
  }

  const foodExpenses = expenses?.filter(e => e.category === 'Food') ?? [];
  const utilityExpenses = expenses?.filter(e => e.category !== 'Food') ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Daily Meal Dashboard
          </h1>
          <p className="text-muted-foreground">
            Log your meals and track expenses for{" "}
            {format(currentDate, "MMMM d, yyyy")}.
          </p>
        </div>
        <DateSwitcher currentDate={currentDate} setCurrentDate={setCurrentDate} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 items-start">
        <MealLog meals={meals ?? []} currentDate={currentDate} />
        <div className="space-y-8">
            <FoodExpenseLog expenses={foodExpenses} currentDate={currentDate} />
            <UtilityExpenseLog expenses={utilityExpenses} currentDate={currentDate} />
        </div>
      </div>
    </div>
  );
}
