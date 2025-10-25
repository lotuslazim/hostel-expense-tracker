"use client";

import { AddExpenseCard } from "@/components/dashboard/AddExpenseCard";
import { LogMealCard } from "@/components/dashboard/LogMealCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { DateCard } from "@/components/dashboard/DateCard";
import { AppHeader } from "@/components/app/header";
import { useState, useMemo } from "react";
import { Welcome } from "@/components/app/welcome";
import { useUser, useDoc, useFirebase, useCollection } from "@/firebase";
import { doc, collection, query, where, Timestamp, orderBy } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import type { Expense } from "@/lib/types";
import { addMonths } from 'date-fns/addMonths';
import { subMonths } from 'date-fns/subMonths';
import { startOfMonth } from 'date-fns/startOfMonth';
import { endOfMonth } from 'date-fns/endOfMonth';
import { SendReminderCard } from "@/components/dashboard/SendReminderCard";

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-80 w-full rounded-lg" />
          <Skeleton className="h-[28rem] w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
        <div className="lg:col-span-3">
           <Skeleton className="h-[calc(100vh-10rem)] w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function DashboardContent({ groupId, userId }: { groupId: string, userId: string }) {
  const { firestore } = useFirebase();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));

  const groupRef = useMemo(() => doc(firestore, "groups", groupId), [groupId, firestore]);
  const { data: groupData, isLoading: isGroupLoading } = useDoc(groupRef);

  const monthDateRange = useMemo(() => ({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  }), [currentMonth]);
  
  const expensesQuery = useMemo(() => {
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

  const mealTypes = useMemo(() => groupData?.settings?.mealTypes ?? [], [groupData]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">Dashboard</h1>
        <p className="text-sm md:text-base text-muted-foreground">Log your meals and expenses for the day.</p>
      </div>
      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <DateCard date={selectedDate} setDate={setSelectedDate} />
            <LogMealCard selectedDate={selectedDate} />
            <AddExpenseCard selectedDate={selectedDate} />
            <SendReminderCard />
          </div>
          <div className="lg:col-span-3">
            <ActivityFeed 
              expenses={expenses || []} 
              isLoading={areExpensesLoading}
              currentMonth={currentMonth}
              onMonthChange={handleMonthChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { firestore } = useFirebase();
  const { user: currentUser, isUserLoading } = useUser();

  const currentUserRef = useMemo(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [firestore, currentUser]);
  const { data: currentUserData, isLoading: isCurrentUserDataLoading } = useDoc(currentUserRef);
  
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

  const groupId = currentUserData?.groupId;
  const userId = currentUser?.uid;

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {groupId && userId ? <DashboardContent groupId={groupId} userId={userId} /> : <Welcome />}
      </main>
    </div>
  );
}