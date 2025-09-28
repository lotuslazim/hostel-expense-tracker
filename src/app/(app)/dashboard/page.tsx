
"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { format, parseISO, startOfDay, endOfDay } from "date-fns";
import { DateSwitcher } from "@/components/dashboard/date-switcher";
import { MealLog } from "@/components/dashboard/meal-log";
import { ExpenseLog } from "@/components/dashboard/expense-log";
import type { Meal, Expense, PurchasedItem } from "@/lib/types";
import { useFirebase, useUser, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, where } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { WelcomeCard } from "@/components/app/welcome-card";
import { ItemLog } from "@/components/dashboard/item-log";

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

  // Queries for meals, expenses, and items
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

  const itemsQuery = useMemoFirebase(() =>
    groupId
      ? query(
          collection(firestore, `groups/${groupId}/purchasedItems`),
          where("date", ">=", dateRange.start),
          where("date", "<=", dateRange.end)
        )
      : null,
    [firestore, groupId, dateRange]
  );

  const { data: meals, isLoading: areMealsLoading } = useCollection<Meal>(mealsQuery);
  const { data: expenses, isLoading: areExpensesLoading } = useCollection<Expense>(expensesQuery);
  const { data: items, isLoading: areItemsLoading } = useCollection<PurchasedItem>(itemsQuery);
  
  const isLoading = isCurrentUserLoading || isCurrentUserDataLoading || areMealsLoading || areExpensesLoading || areItemsLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }
  
  if (!groupId) {
    return <WelcomeCard />;
  }

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <MealLog meals={meals ?? []} currentDate={currentDate} />
        <ExpenseLog expenses={expenses ?? []} currentDate={currentDate} />
        <ItemLog items={items ?? []} currentDate={currentDate} />
      </div>
    </div>
  );
}
