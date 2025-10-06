
"use client";

import { useMemo, useState } from "react";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { AppHeader } from "@/components/app/header";
import { useUser, useDoc, useFirebase, useCollection } from "@/firebase";
import { doc, collection, query, where, Timestamp } from "firebase/firestore";
import type { Purchase } from "@/lib/types";
import { addMonths, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { MonthSwitcher } from "@/components/report/month-switcher";
import { WelcomeCard } from "@/components/app/welcome-card";

export default function InventoryPage() {
  const { firestore } = useFirebase();
  const { user: currentUser, isUserLoading } = useUser();
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));

  const currentUserRef = useMemo(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [firestore, currentUser]);
  const { data: currentUserData, isLoading: isCurrentUserDataLoading } = useDoc(currentUserRef);

  const groupId = currentUserData?.groupId;

  const monthDateRange = useMemo(() => {
    return {
      start: Timestamp.fromDate(startOfMonth(currentMonth)),
      end: Timestamp.fromDate(endOfMonth(currentMonth)),
    };
  }, [currentMonth]);
  
  const purchasesQuery = useMemo(() => {
    if (!groupId) return null;
    return query(
      collection(firestore, `groups/${groupId}/purchases`),
      where("date", ">=", monthDateRange.start),
      where("date", "<=", monthDateRange.end)
    );
  }, [firestore, groupId, monthDateRange]);

  const { data: purchases, isLoading: arePurchasesLoading } = useCollection<Purchase>(purchasesQuery);
  
  const handleMonthChange = (direction: "next" | "prev") => {
    setCurrentMonth(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1));
  }
  
  const isLoading = isUserLoading || isCurrentUserDataLoading;
  
  if (isLoading) {
    return (
       <div className="flex flex-col min-h-screen">
          <AppHeader />
          <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <InventoryTable purchases={[]} isLoading={true} />
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Inventory</h1>
                    <p className="text-muted-foreground">A summary of all food and grocery items purchased.</p>
                </div>
                <MonthSwitcher currentDate={currentMonth} onMonthChange={handleMonthChange} />
            </div>
            <InventoryTable purchases={purchases} isLoading={arePurchasesLoading} />
        </div>
      </main>
    </div>
  );
}
