"use client";

import { AddExpenseCard } from "@/components/dashboard/AddExpenseCard";
import { LogMealCard } from "@/components/dashboard/LogMealCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { DateCard } from "@/components/dashboard/DateCard";
import { AppHeader } from "@/components/app/header";
import { useState } from "react";
import { WelcomeCard } from "@/components/app/welcome-card";
import { useUser, useDoc, useFirebase } from "@/firebase";
import { useMemo } from "react";
import { doc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import type { Expense } from "@/lib/types";
import { collection, query, where, Timestamp, orderBy } from "firebase/firestore";
import { useCollection } from "@/firebase/firestore/use-collection";
import { addMonths, subMonths, startOfMonth, endOfMonth } from "date-fns";


function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
        <div className="lg:col-span-2 space-y-6">
           <Skeleton className="h-[85vh] w-full" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { firestore } = useFirebase();
  const { user: currentUser, isUserLoading } = useUser();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));


  const currentUserRef = useMemo(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [firestore, currentUser]);
  const { data: currentUserData, isLoading: isCurrentUserDataLoading } = useDoc(currentUserRef);
  
  const groupId = currentUserData?.groupId;

  const monthDateRange = useMemo(() => ({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  }), [currentMonth]);

  const expensesQuery = useMemo(() => {
    if (!groupId) return null;
    return query(
      collection(firestore, `groups/${groupId}/expenses`),
      where("date", ">=", Timestamp.fromDate(monthDateRange.start)),
      where("date", "<=", Timestamp.fromDate(monthDateRange.end)),
      orderBy("date", "desc")
    );
  }, [firestore, groupId, monthDateRange]);

  const { data: expenses, isLoading: areExpensesLoading } = useCollection<Expense>(expensesQuery);

  const handleMonthChange = (direction: "next" | "prev") => {
    setCurrentMonth(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1));
  }

  const isLoading = isUserLoading || isCurrentUserDataLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <AppHeader />
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <DashboardSkeleton />
        </main>
      </div>
    )
  }

  if (!groupId) {
     return (
      <div className="flex flex-col min-h-screen">
        <AppHeader />
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <WelcomeCard />
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                    <div className="lg:col-span-2">
                        {areExpensesLoading ? (
                            <Skeleton className="h-[85vh] w-full" />
                        ) : (
                            <ActivityFeed 
                            expenses={expenses || []} 
                            currentMonth={currentMonth}
                            onMonthChange={handleMonthChange}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}
