
"use client";

import { useState, useMemo } from "react";
import { useFirebase, useUser, useDoc, useCollection } from "@/firebase";
import { doc, collection, query, where, orderBy } from "firebase/firestore";
import { WelcomeCard } from "@/components/app/welcome-card";
import { Skeleton } from "@/components/ui/skeleton";
import { MealLogForm } from "@/components/dashboard/meal-log-form";
import { ExpenseLogForm } from "@/components/dashboard/expense-log-form";
import { SharedExpenses } from "@/components/dashboard/shared-expenses";
import { UtilityLogForm } from "@/components/dashboard/utility-log-form";
import { DailySummary } from "@/components/dashboard/daily-summary";

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
          <Skeleton className="h-80 w-full" />
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
  const { data: currentUserData, isLoading: isCurrentUserDataLoading } =
    useDoc(currentUserRef);
  const groupId = currentUserData?.groupId;

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

  if (!groupId || !currentUser) {
    return <WelcomeCard />;
  }

  return (
    <div className="space-y-6">
       <DailySummary 
          userId={currentUser.uid} 
          groupId={groupId} 
          selectedDate={currentDate} 
          onDateChange={setCurrentDate}
       />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
          <MealLogForm selectedDate={currentDate} />
          <ExpenseLogForm selectedDate={currentDate} />
          <UtilityLogForm selectedDate={currentDate} />
        </div>
        <div className="lg:col-span-2">
          <SharedExpenses expensesQuery={expensesQuery} />
        </div>
      </div>
    </div>
  );
}
