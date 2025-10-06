
"use client";

import { AddExpenseCard } from "@/components/dashboard/AddExpenseCard";
import { LogMealCard } from "@/components/dashboard/LogMealCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { DateCard } from "@/components/dashboard/DateCard";
import { AppHeader } from "@/components/app/header";
import { useState, useMemo, useEffect, useCallback } from "react";
import { WelcomeCard } from "@/components/app/welcome-card";
import { useUser, useDoc, useFirebase } from "@/firebase";
import { doc, collection, query, where, Timestamp, orderBy, limit, startAfter, getDocs, DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import type { Expense } from "@/lib/types";
import { addMonths, subMonths, startOfMonth, endOfMonth } from "date-fns";

const EXPENSE_PAGE_SIZE = 15;

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-80 w-full rounded-lg" />
          <Skeleton className="h-[28rem] w-full rounded-lg" />
        </div>
        <div className="lg:col-span-2">
           <Skeleton className="h-[calc(100vh-10rem)] w-full rounded-lg" />
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

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [lastVisibleExpense, setLastVisibleExpense] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMoreExpenses, setHasMoreExpenses] = useState(true);
  const [areExpensesLoading, setAreExpensesLoading] = useState(true);
  const [isMoreExpensesLoading, setIsMoreExpensesLoading] = useState(false);

  const currentUserRef = useMemo(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [firestore, currentUser]);
  const { data: currentUserData, isLoading: isCurrentUserDataLoading } = useDoc(currentUserRef);
  
  const groupId = currentUserData?.groupId;

  const monthDateRange = useMemo(() => ({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  }), [currentMonth]);
  
  const buildExpensesQuery = useCallback((lastVisible: QueryDocumentSnapshot<DocumentData> | null) => {
    if (!groupId) return null;
    let q = query(
      collection(firestore, `groups/${groupId}/expenses`),
      where("date", ">=", Timestamp.fromDate(monthDateRange.start)),
      where("date", "<=", Timestamp.fromDate(monthDateRange.end)),
      orderBy("date", "desc"),
      limit(EXPENSE_PAGE_SIZE)
    );
    if (lastVisible) {
      q = query(q, startAfter(lastVisible));
    }
    return q;
  }, [firestore, groupId, monthDateRange]);

  const fetchExpenses = useCallback(async (lastVisible: QueryDocumentSnapshot<DocumentData> | null) => {
    const isInitialFetch = !lastVisible;
    if (isInitialFetch) {
      setAreExpensesLoading(true);
    } else {
      setIsMoreExpensesLoading(true);
    }

    const q = buildExpensesQuery(lastVisible);
    if (!q) {
      setAreExpensesLoading(false);
      setIsMoreExpensesLoading(false);
      return;
    }
    
    try {
      const documentSnapshots = await getDocs(q);
      const newExpenses = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
      const lastVisibleDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];
      
      setExpenses(prev => isInitialFetch ? newExpenses : [...prev, ...newExpenses]);
      setLastVisibleExpense(lastVisibleDoc || null);
      setHasMoreExpenses(newExpenses.length === EXPENSE_PAGE_SIZE);
    } catch (error) {
      console.error("Error fetching expenses: ", error);
    } finally {
      setAreExpensesLoading(false);
      setIsMoreExpensesLoading(false);
    }
  }, [buildExpensesQuery]);

  useEffect(() => {
    setExpenses([]);
    setLastVisibleExpense(null);
    setHasMoreExpenses(true);
    fetchExpenses(null);
  }, [fetchExpenses, currentMonth]);


  const handleMonthChange = (direction: "next" | "prev") => {
    setCurrentMonth(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1));
  }
  
  const handleLoadMoreExpenses = () => {
    if (lastVisibleExpense) {
      fetchExpenses(lastVisibleExpense);
    }
  };

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
                        <ActivityFeed 
                            expenses={expenses} 
                            isLoading={areExpensesLoading}
                            currentMonth={currentMonth}
                            onMonthChange={handleMonthChange}
                            onLoadMore={handleLoadMoreExpenses}
                            hasMore={hasMoreExpenses}
                            isMoreLoading={isMoreExpensesLoading}
                        />
                    </div>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}
