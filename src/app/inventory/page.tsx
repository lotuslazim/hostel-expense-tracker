
"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { AppHeader } from "@/components/app/header";
import { useUser, useDoc, useFirebase } from "@/firebase";
import { doc, collection, query, where, Timestamp, getDocs, orderBy, limit, startAfter, QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import type { Purchase } from "@/lib/types";
import { addMonths } from 'date-fns/addMonths';
import { subMonths } from 'date-fns/subMonths';
import { startOfMonth } from 'date-fns/startOfMonth';
import { endOfMonth } from 'date-fns/endOfMonth';
import { MonthSwitcher } from "@/components/report/month-switcher";
import { WelcomeCard } from "@/components/app/welcome-card";

const PURCHASE_PAGE_SIZE = 20;

export default function InventoryPage() {
  const { firestore } = useFirebase();
  const { user: currentUser, isUserLoading } = useUser();
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [lastVisiblePurchase, setLastVisiblePurchase] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMorePurchases, setHasMorePurchases] = useState(true);
  const [arePurchasesLoading, setArePurchasesLoading] = useState(true);
  const [isMorePurchasesLoading, setIsMorePurchasesLoading] = useState(false);

  const currentUserRef = useMemo(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [firestore, currentUser]);
  const { data: currentUserData, isLoading: isCurrentUserDataLoading } = useDoc(currentUserRef);

  const groupId = currentUserData?.groupId;

  const monthDateRange = useMemo(() => {
    return {
      start: Timestamp.fromDate(startOfMonth(currentMonth)),
      end: Timestamp.fromDate(endOfMonth(currentMonth)),
    };
  }, [currentMonth]);
  
  const buildPurchasesQuery = useCallback((lastVisible: QueryDocumentSnapshot<DocumentData> | null) => {
    if (!groupId) return null;
    let q = query(
      collection(firestore, `groups/${groupId}/purchases`),
      where("date", ">=", monthDateRange.start),
      where("date", "<=", monthDateRange.end),
      orderBy("date", "desc"),
      limit(PURCHASE_PAGE_SIZE)
    );
     if (lastVisible) {
      q = query(q, startAfter(lastVisible));
    }
    return q;
  }, [firestore, groupId, monthDateRange]);

  const fetchPurchases = useCallback(async (lastVisible: QueryDocumentSnapshot<DocumentData> | null) => {
    const isInitialFetch = !lastVisible;
    if (isInitialFetch) {
      setArePurchasesLoading(true);
    } else {
      setIsMorePurchasesLoading(true);
    }
    
    const q = buildPurchasesQuery(lastVisible);
    if (!q) {
      setArePurchasesLoading(false);
      setIsMorePurchasesLoading(false);
      return;
    }

    try {
      const documentSnapshots = await getDocs(q);
      const newPurchases = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() } as Purchase));
      const lastVisibleDoc = documentSnapshots.docs[documentSnapshots.docs.length-1];
      
      setPurchases(prev => isInitialFetch ? newPurchases : [...prev, ...newPurchases]);
      setLastVisiblePurchase(lastVisibleDoc || null);
      setHasMorePurchases(newPurchases.length === PURCHASE_PAGE_SIZE);

    } catch (error) {
        console.error("Error fetching purchases: ", error);
    } finally {
        setArePurchasesLoading(false);
        setIsMorePurchasesLoading(false);
    }
  }, [buildPurchasesQuery]);

  useEffect(() => {
    setPurchases([]);
    setLastVisiblePurchase(null);
    setHasMorePurchases(true);
    fetchPurchases(null);
  }, [fetchPurchases, currentMonth]);
  
  const handleMonthChange = (direction: "next" | "prev") => {
    setCurrentMonth(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1));
  }

  const handleLoadMorePurchases = () => {
    if (lastVisiblePurchase) {
        fetchPurchases(lastVisiblePurchase);
    }
  }
  
  const isLoading = isUserLoading || isCurrentUserDataLoading;
  
  if (isLoading) {
    return (
       <div className="flex flex-col min-h-screen">
          <AppHeader />
          <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <InventoryTable purchases={[]} isLoading={true} onLoadMore={()=>{}} hasMore={false} isMoreLoading={false} />
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
                    <h1 className="text-2xl md:text-3xl font-bold font-headline text-mint-500">Inventory</h1>
                    <p className="text-sm md:text-base text-muted-foreground">A summary of all food and grocery items purchased.</p>
                </div>
                <MonthSwitcher currentDate={currentMonth} onMonthChange={handleMonthChange} />
            </div>
            <InventoryTable 
              purchases={purchases} 
              isLoading={arePurchasesLoading}
              onLoadMore={handleLoadMorePurchases}
              hasMore={hasMorePurchases}
              isMoreLoading={isMorePurchasesLoading}
            />
        </div>
      </main>
    </div>
  );
}
