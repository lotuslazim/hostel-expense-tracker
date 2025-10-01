
"use client";

import { useMemo, useState } from 'react';
import { useFirebase, useUser, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { WelcomeCard } from '@/components/app/welcome-card';
import { Skeleton } from '@/components/ui/skeleton';
import { AddItemForm } from '@/components/inventory/AddItemForm';
import { InventoryTable } from '@/components/inventory/InventoryTable';
import { MonthSwitcher } from '@/components/report/month-switcher';
import { startOfMonth, addMonths, subMonths, format } from 'date-fns';
import { parseISO } from 'date-fns';
import { useSearchParams, useRouter } from 'next/navigation';


function InventoryPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <Skeleton className="h-9 w-80" />
        <Skeleton className="h-10 w-[330px]" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Skeleton className="h-72 w-full" />
        </div>
        <div className="lg:col-span-2">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const { firestore } = useFirebase();
  const { user: currentUser, isUserLoading } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const monthParam = searchParams.get('month');

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

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Food Inventory</h1>
          <p className="text-muted-foreground">
            Track monthly item requirements, consumption, and expenses for {format(currentDate, "MMMM yyyy")}.
          </p>
        </div>
         <MonthSwitcher
          currentDate={currentDate}
          onMonthChange={handleMonthChange}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1 space-y-6">
           <AddItemForm groupId={groupId}/>
        </div>
        <div className="lg:col-span-2">
            <InventoryTable groupId={groupId} selectedMonth={currentDate} />
        </div>
      </div>
    </div>
  );
}

