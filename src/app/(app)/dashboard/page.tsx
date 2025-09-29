
"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { format, parseISO, startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";
import { DateSwitcher } from "@/components/dashboard/date-switcher";
import { MealLog } from "@/components/dashboard/meal-log";
import { AllExpenses } from "@/components/dashboard/all-expenses";
import { ItemLog } from "@/components/dashboard/item-log";
import type { Meal, Expense, PurchasedItem } from "@/lib/types";
import { useFirebase, useUser, useDoc, useCollection } from "@/firebase";
import { doc, collection, query, where } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { WelcomeCard } from "@/components/app/welcome-card";
import { MonthlyExpenses } from "@/components/dashboard/monthly-expenses";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

function DataError() {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Error Loading Data</AlertTitle>
      <AlertDescription>
        There was a problem fetching your dashboard data from the server. Please try refreshing the page.
      </AlertDescription>
    </Alert>
  )
}


function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-10 rounded-md" />
            <Skeleton className="h-10 w-[240px] rounded-md" />
            <Skeleton className="h-10 w-10 rounded-md" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-8">
            <Skeleton className="h-72 w-full rounded-lg" />
            <Skeleton className="h-96 w-full rounded-lg" />
        </div>
        <Skeleton className="h-[760px] w-full rounded-lg lg:col-span-2" />
      </div>
      <Skeleton className="h-96 w-full rounded-lg" />
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

  const currentUserRef = useMemo(
    () => (currentUser ? doc(firestore, "users", currentUser.uid) : null),
    [firestore, currentUser]
  );
  const { data: currentUserData, isLoading: isCurrentUserDataLoading, error: currentUserDataError } =
    useDoc(currentUserRef);
  const groupId = currentUserData?.groupId;

  const dateRange = useMemo(() => {
    return {
      start: startOfDay(currentDate),
      end: endOfDay(currentDate),
    };
  }, [currentDate]);

  const monthDateRange = useMemo(() => {
    return {
      start: startOfMonth(currentDate),
      end: endOfMonth(currentDate),
    };
  }, [currentDate]);


  // Queries for meals and expenses
  const mealsQuery = useMemo(() => {
    if (!groupId) return null;
    return query(
        collection(firestore, `groups/${groupId}/meals`),
        where("date", ">=", dateRange.start),
        where("date", "<=", dateRange.end)
      )
  }, [firestore, groupId, dateRange]
  );

  const expensesQuery = useMemo(() => {
    if (!groupId) return null;
    return query(
        collection(firestore, `groups/${groupId}/expenses`),
        where("date", ">=", dateRange.start),
        where("date", "<=", dateRange.end)
      )
  }, [firestore, groupId, dateRange]
  );
    
  const itemsQuery = useMemo(() => {
    if (!groupId) return null;
    return query(
        collection(firestore, `groups/${groupId}/purchasedItems`),
        where("date", ">=", dateRange.start),
        where("date", "<=", dateRange.end)
      )
  }, [firestore, groupId, dateRange]
  );
  
  const monthlyExpensesQuery = useMemo(() => {
    if (!groupId) return null;
    return query(
        collection(firestore, `groups/${groupId}/expenses`),
        where("date", ">=", monthDateRange.start),
        where("date", "<=", monthDateRange.end)
      )
  }, [firestore, groupId, monthDateRange]
  );


  const { data: meals, isLoading: areMealsLoading, error: mealsError } = useCollection<Meal>(mealsQuery);
  const { data: expenses, isLoading: areExpensesLoading, error: expensesError } = useCollection<Expense>(expensesQuery);
  const { data: items, isLoading: areItemsLoading, error: itemsError } = useCollection<PurchasedItem>(itemsQuery);
  const { data: monthlyExpenses, isLoading: areMonthlyExpensesLoading, error: monthlyExpensesError } = useCollection<Expense>(monthlyExpensesQuery);

  const isLoading = isCurrentUserLoading || isCurrentUserDataLoading || (!!groupId && (areMealsLoading || areExpensesLoading || areMonthlyExpensesLoading || areItemsLoading));
  const hasError = currentUserDataError || mealsError || expensesError || itemsError || monthlyExpensesError;
  
  const initialLoading = isCurrentUserLoading || isCurrentUserDataLoading;

  if (initialLoading) {
    return <DashboardSkeleton />;
  }
  
  if (!groupId) {
    return <WelcomeCard />;
  }

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (hasError) {
    return <DataError />;
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
        <div className="space-y-8">
          <MealLog meals={meals ?? []} currentDate={currentDate} />
          <ItemLog items={items ?? []} currentDate={currentDate} />
        </div>
        <div className="lg:col-span-2">
            <AllExpenses expenses={expenses ?? []} currentDate={currentDate} />
        </div>
      </div>
      
      <MonthlyExpenses expenses={monthlyExpenses ?? []} currentDate={currentDate} />
    </div>
  );
}
