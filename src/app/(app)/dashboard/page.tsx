
"use client";

import { useState, useMemo } from "react";
import { useFirebase, useUser, useDoc, useCollection } from "@/firebase";
import { doc, collection, query, orderBy } from "firebase/firestore";
import { WelcomeCard } from "@/components/app/welcome-card";
import { Skeleton } from "@/components/ui/skeleton";
import { MealLogForm } from "@/components/dashboard/meal-log-form";
import { ExpenseLogForm } from "@/components/dashboard/expense-log-form";
import { SharedExpenses } from "@/components/dashboard/shared-expenses";
import { UtilityLogForm } from "@/components/dashboard/utility-log-form";
import { DailySummary } from "@/components/dashboard/daily-summary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Utensils, ShoppingCart, Receipt } from "lucide-react";

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-80 mt-2" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
          <Skeleton className="h-96 w-full" />
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
  const userId = currentUser?.uid;

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

  if (!groupId || !userId) {
    return <WelcomeCard />;
  }

  return (
    <div className="space-y-6">
       <DailySummary 
          userId={userId} 
          groupId={groupId} 
          selectedDate={currentDate} 
          onDateChange={setCurrentDate}
       />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1 space-y-8">
           <Tabs defaultValue="meal" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="meal"><Utensils className="mr-2 h-4 w-4"/>Meal</TabsTrigger>
              <TabsTrigger value="expense"><ShoppingCart className="mr-2 h-4 w-4"/>Expense</TabsTrigger>
              <TabsTrigger value="utility"><Receipt className="mr-2 h-4 w-4"/>Utility</TabsTrigger>
            </TabsList>
            <TabsContent value="meal">
              <MealLogForm selectedDate={currentDate} />
            </TabsContent>
            <TabsContent value="expense">
              <ExpenseLogForm selectedDate={currentDate} />
            </TabsContent>
            <TabsContent value="utility">
              <UtilityLogForm selectedDate={currentDate} />
            </TabsContent>
          </Tabs>
        </div>
        <div className="lg:col-span-2">
          <SharedExpenses expensesQuery={expensesQuery} />
        </div>
      </div>
    </div>
  );
}
