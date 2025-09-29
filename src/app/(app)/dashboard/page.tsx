
"use client";

import { useMemo, useState } from "react";
import { useFirebase, useUser, useDoc, useCollection } from "@/firebase";
import { doc, collection, query, where, orderBy } from "firebase/firestore";
import { startOfMonth, endOfMonth } from "date-fns";
import { WelcomeCard } from "@/components/app/welcome-card";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import type { MealLog, Expense } from "@/lib/types";
import { LogMealCard } from "@/components/dashboard/LogMealCard";
import { AddExpenseCard } from "@/components/dashboard/AddExpenseCard";
import { DateCard } from "@/components/dashboard/DateCard";
import { GroupChatCard } from "@/components/dashboard/GroupChatCard";

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
        <div className="lg:col-span-2 space-y-6">
           <Skeleton className="h-[45vh] w-full" />
           <Skeleton className="h-[45vh] w-full" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { firestore } = useFirebase();
  const { user: currentUser, isUserLoading } = useUser();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());


  const currentUserRef = useMemo(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [firestore, currentUser]);
  const { data: currentUserData, isLoading: isCurrentUserDataLoading } = useDoc(currentUserRef);
  
  const groupId = currentUserData?.groupId;

  const dateRange = useMemo(() => ({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
  }), []);

  const mealsQuery = useMemo(() => {
    if (!groupId) return null;
    return query(
      collection(firestore, `groups/${groupId}/meals`),
      where("date", ">=", dateRange.start),
      where("date", "<=", dateRange.end),
      orderBy("date", "desc")
    );
  }, [firestore, groupId, dateRange]);

  const expensesQuery = useMemo(() => {
    if (!groupId) return null;
    return query(
      collection(firestore, `groups/${groupId}/expenses`),
      where("date", ">=", dateRange.start),
      where("date", "<=", dateRange.end),
      orderBy("date", "desc")
    );
  }, [firestore, groupId, dateRange]);

  const { data: meals, isLoading: areMealsLoading } = useCollection<MealLog>(mealsQuery);
  const { data: expenses, isLoading: areExpensesLoading } = useCollection<Expense>(expensesQuery);

  const isLoading = isUserLoading || isCurrentUserDataLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!groupId) {
    return <WelcomeCard />;
  }

  const isDataLoading = areMealsLoading || areExpensesLoading;

  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Dashboard</h1>
        <p className="text-muted-foreground">Log your meals and expenses for the day.</p>
      </div>

      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
                <DateCard date={selectedDate} setDate={setSelectedDate} />
                <LogMealCard selectedDate={selectedDate} />
                <AddExpenseCard selectedDate={selectedDate} />
            </div>
            <div className="lg:col-span-2 space-y-6">
                <GroupChatCard />
                {isDataLoading ? (
                    <Skeleton className="h-96 w-full" />
                ) : (
                    <ActivityFeed meals={meals || []} expenses={expenses || []} />
                )}
            </div>
        </div>
      </div>
    </div>
  );
}

    