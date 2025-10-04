"use client";

import { useMemo, useCallback } from 'react';
import { useFirebase, useUser, useDoc, useCollection } from '@/firebase';
import { doc, collection, query, where, Timestamp, orderBy } from 'firebase/firestore';
import { WelcomeCard } from '@/components/app/welcome-card';
import { Skeleton } from '@/components/ui/skeleton';
import { InventoryTable } from '@/components/inventory/InventoryTable';
import { MonthSwitcher } from '@/components/report/month-switcher';
import { startOfMonth, addMonths, subMonths, format, parseISO, endOfMonth } from 'date-fns';
import { useSearchParams, useRouter } from 'next/navigation';
import type { Purchase } from '@/lib/types';
import { useInventory } from '@/contexts/InventoryContext';


function InventoryPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <Skeleton className="h-9 w-80" />
        <Skeleton className="h-10 w-[330px]" />
      </div>
      <div >
          <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}

export function Inventory() {
  const { firestore } = useFirebase();
  const { user: currentUser, isUserLoading } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const monthParam = searchParams.get('month');
  const { lastUpdate } = useInventory();


  const currentDate = useMemo(() => {
    if (monthParam) {
      try {
        const parsedDate = parseISO(`${monthParam}-01`);
        if (!isNaN(parsedDate.getTime())) {
          return startOfMonth(parsedDate);
        }
      } catch (e) {
        console.warn("Invalid date in URL, defaulting to current month.", e);
      }
    }
    return startOfMonth(new Date());
  }, [monthParam]);


  const currentUserRef = useMemo(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [firestore, currentUser]);
  const { data: currentUserData, isLoading: isCurrentUserDataLoading } = useDoc(currentUserRef);
  
  const groupId = currentUserData?.groupId;

  const monthDateRange = useMemo(() => ({
      start: startOfMonth(currentDate),
      end: endOfMonth(currentDate),
  }), [currentDate]);

  const purchasesQuery = useMemo(() => 
      (groupId ? query(
          collection(firestore, `groups/${groupId}/purchases`),
          where("date", ">=", Timestamp.fromDate(monthDateRange.start)),
          where("date", "<=", Timestamp.fromDate(monthDateRange.end))
      ) : null),
      [firestore, groupId, monthDateRange, lastUpdate]
  );
  
  const { data: purchases, isLoading: arePurchasesLoading, refetch: refetchPurchases } = useCollection<Purchase>(purchasesQuery);

  const handleDataRefresh = useCallback(() => {
    refetchPurchases();
  }, [refetchPurchases]);


  const handleMonthChange = (direction: "next" | "prev") => {
    const newDate = direction === "next" ? addMonths(currentDate, 1) : subMonths(currentDate, 1);
    const newUrl = `/inventory?month=${format(newDate, 'yyyy-MM')}`;
    router.push(newUrl, { scroll: false });
  };
  
  const isLoading = isUserLoading || isCurrentUserDataLoading;

  if (isLoading) {
    return <InventoryPageSkeleton />;
  }

  if (!groupId) {
    return <WelcomeCard />;
  }
  
  const isDataLoading = arePurchasesLoading;

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Food Inventory</h1>
          <p className="text-muted-foreground">
            A summary of all food & grocery items purchased in {format(currentDate, "MMMM yyyy")}.
          </p>
        </div>
         <MonthSwitcher
          currentDate={currentDate}
          onMonthChange={handleMonthChange}
        />
      </div>

      <div className="items-start">
        <InventoryTable 
          purchases={purchases} 
          isLoading={isDataLoading} 
        />
      </div>
    </div>
  );
}
