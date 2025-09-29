
"use client";

import { useState, useMemo, useEffect } from "react";
import { useFirebase, useUser, useDoc } from "@/firebase";
import { doc, collection, query, where, orderBy } from "firebase/firestore";
import { addMonths, subMonths, startOfDay, endOfDay, format } from "date-fns";
import { WelcomeCard } from "@/components/app/welcome-card";
import { Skeleton } from "@/components/ui/skeleton";
import { MealLogForm } from "@/components/dashboard/meal-log-form";
import { ExpenseLogForm } from "@/components/dashboard/expense-log-form";
import { SharedExpenses } from "@/components/dashboard/shared-expenses";
import { DateSwitcher } from "@/components/dashboard/date-switcher";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-80 mt-2" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
        <div className="lg:col-span-2">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { firestore } = useFirebase();
  const { user: currentUser, isUserLoading: isCurrentUserLoading } = useUser();

  const currentUserRef = useMemo(
    () => (currentUser ? doc(firestore, "users", currentUser.uid) : null),
    [firestore, currentUser]
  );
  const {
    data: currentUserData,
    isLoading: isCurrentUserDataLoading,
  } = useDoc(currentUserRef);
  const groupId = currentUserData?.groupId;

  const handleDateChange = (direction: "next" | "prev") => {
    const newDate =
      direction === "next"
        ? addMonths(currentDate, 1)
        : subMonths(currentDate, 1);
    setCurrentDate(newDate);
  };
  
  const expensesQuery = useMemo(() => {
    if (!groupId) return null;
    return query(
        collection(firestore, `groups/${groupId}/expenses`),
        orderBy("date", "desc")
      );
  }, [firestore, groupId]);

  const isLoading = isCurrentUserLoading || isCurrentUserDataLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!groupId) {
    return <WelcomeCard />;
  }

  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Dashboard</h1>
        <p className="text-muted-foreground">Log your meals and expenses for the day.</p>
      </div>

       <div className="flex items-center gap-2 pt-2">
          <DateSwitcher
              currentDate={currentDate}
              onDateChange={setCurrentDate}
            />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
            <MealLogForm selectedDate={currentDate} />
            <ExpenseLogForm selectedDate={currentDate} />
        </div>
        <div className="lg:col-span-2">
            <SharedExpenses expensesQuery={expensesQuery} />
        </div>
      </div>
    </div>
  );
}
