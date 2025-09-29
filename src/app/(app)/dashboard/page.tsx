
"use client";

import { useState, useMemo } from "react";
import { useFirebase, useUser, useDoc, useCollection } from "@/firebase";
import { doc, collection, query, where, orderBy } from "firebase/firestore";
import { startOfMonth, endOfMonth } from "date-fns";
import { WelcomeCard } from "@/components/app/welcome-card";
import { Skeleton } from "@/components/ui/skeleton";
import { ActionToolbar } from "@/components/dashboard/ActionToolbar";
import { MonthlyOverviewChart } from "@/components/dashboard/MonthlyOverviewChart";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import type { MealLog, Expense } from "@/lib/types";

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-72 w-full" />
        </div>
        <div className="lg:col-span-1 space-y-6">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { firestore } = useFirebase();
  const { user: currentUser, isUserLoading } = useUser();
  const [isLogMealOpen, setIsLogMealOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

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
      <ActionToolbar
        onLogMealClick={() => setIsLogMealOpen(true)}
        onAddExpenseClick={() => setIsAddExpenseOpen(true)}
        isLogMealOpen={isLogMealOpen}
        setIsLogMealOpen={setIsLogMealOpen}
        isAddExpenseOpen={isAddExpenseOpen}
        setIsAddExpenseOpen={setIsAddExpenseOpen}
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3">
            <h2 className="text-2xl font-bold tracking-tight mb-4 font-headline">Monthly Overview</h2>
            {isDataLoading ? (
                <Skeleton className="h-72 w-full" />
            ) : (
                <MonthlyOverviewChart meals={meals || []} expenses={expenses || []} />
            )}
        </div>
        <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold tracking-tight mb-4 font-headline">Group Activity</h2>
             {isDataLoading ? (
                <Skeleton className="h-96 w-full" />
            ) : (
                <ActivityFeed meals={meals || []} expenses={expenses || []} />
            )}
        </div>
      </div>
    </div>
  );
}
