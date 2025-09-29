
"use client";

import { useState, useMemo, useEffect } from "react";
import { useFirebase, useUser, useDoc, useCollection } from "@/firebase";
import { doc, collection, query, where, orderBy, Timestamp } from "firebase/firestore";
import { addDays, subDays, format, startOfDay } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { WelcomeCard } from "@/components/app/welcome-card";
import { MealLogForm } from "@/components/dashboard/meal-log-form";
import { ExpenseLogForm } from "@/components/dashboard/expense-log-form";
import { SharedExpenses } from "@/components/dashboard/shared-expenses";
import { DateSwitcher } from "@/components/dashboard/date-switcher";
import type { Meal, Expense } from "@/lib/types";

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 space-y-8">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
      <div className="lg:col-span-2">
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const { firestore } = useFirebase();
  const { user: currentUser, isUserLoading: isCurrentUserLoading } = useUser();

  const currentUserRef = useMemo(
    () => (currentUser ? doc(firestore, "users", currentUser.uid) : null),
    [firestore, currentUser]
  );
  const { data: currentUserData, isLoading: isCurrentUserDataLoading } = useDoc(currentUserRef);
  
  const groupId = currentUserData?.groupId;

  const handleDateChange = (direction: "next" | "prev") => {
    const newDate = direction === "next" ? addDays(selectedDate, 1) : subDays(selectedDate, 1);
    setSelectedDate(newDate);
  };

  const mealsQuery = useMemo(() => {
    if (!currentUser || !groupId) return null;
    const todayStart = startOfDay(selectedDate);
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
    
    return query(
      collection(firestore, `groups/${groupId}/meals`),
      where("userId", "==", currentUser.uid),
      where("date", ">=", Timestamp.fromDate(todayStart)),
      where("date", "<=", Timestamp.fromDate(todayEnd))
    );
  }, [firestore, currentUser, groupId, selectedDate]);
  
  const { data: mealsData, isLoading: areMealsLoading } = useCollection<Meal>(mealsQuery);

  const expensesQuery = useMemo(() => {
     if (!groupId) return null;
     return query(
        collection(firestore, `groups/${groupId}/expenses`),
        orderBy("date", "desc")
     );
  }, [firestore, groupId]);

  const { data: expensesData, isLoading: areExpensesLoading } = useCollection<Expense>(expensesQuery);
  
  const membersQuery = useMemo(() => {
    if (!groupId) return null;
    return collection(firestore, `groups/${groupId}/members`);
  }, [firestore, groupId]);

  const { data: membersData, isLoading: areMembersLoading } = useCollection(membersQuery);


  const isLoading = isCurrentUserLoading || isCurrentUserDataLoading || (!!groupId && (areMealsLoading || areExpensesLoading || areMembersLoading));
  
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!groupId) {
    return <WelcomeCard />;
  }
  
  const lunchMeals = mealsData?.filter(m => m.mealType === 'lunch').reduce((sum, m) => sum + m.mealNumber, 0) || 0;
  const dinnerMeals = mealsData?.filter(m => m.mealType === 'dinner').reduce((sum, m) => sum + m.mealNumber, 0) || 0;
  
  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Dashboard
        </h1>
        <p className="text-muted-foreground">Log your meals and expenses for the day.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1 space-y-8">
            <MealLogForm
              userId={currentUser!.uid}
              groupId={groupId}
              dateSwitcher={<DateSwitcher currentDate={selectedDate} onDateChange={handleDateChange} />}
              selectedDate={selectedDate}
              lunchMeals={lunchMeals}
              dinnerMeals={dinnerMeals}
            />
            <ExpenseLogForm 
               userId={currentUser!.uid}
               groupId={groupId}
            />
        </div>
        <div className="lg:col-span-2">
           <SharedExpenses expenses={expensesData || []} members={membersData || []} />
        </div>
      </div>
    </div>
  );
}
