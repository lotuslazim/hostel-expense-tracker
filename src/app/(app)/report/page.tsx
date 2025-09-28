
"use client";

import { MonthlySummary } from "@/components/report/monthly-summary";
import { useState, useEffect } from "react";
import { useSearchParams } from 'next/navigation';
import { startOfMonth, format, addMonths, subMonths, parseISO } from "date-fns";
import { MonthSwitcher } from "@/components/report/month-switcher";
import { useUser, useDoc, useMemoFirebase, useFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { WelcomeCard } from "@/components/app/welcome-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReportPage() {
  const searchParams = useSearchParams();
  const monthParam = searchParams.get('month');
  
  const getInitialDate = () => {
    if (monthParam) {
      try {
        const parsedDate = parseISO(monthParam);
        return startOfMonth(parsedDate);
      } catch (e) {
        return startOfMonth(new Date());
      }
    }
    return startOfMonth(new Date());
  };

  const [currentDate, setCurrentDate] = useState(getInitialDate);
  const { firestore } = useFirebase();
  const { user: currentUser, isUserLoading: isCurrentUserLoading } = useUser();
  const router = useRouter();


  const currentUserRef = useMemoFirebase(
    () => (currentUser ? doc(firestore, "users", currentUser.uid) : null),
    [firestore, currentUser]
  );
  const { data: currentUserData, isLoading: isCurrentUserDataLoading } =
    useDoc(currentUserRef);
  const groupId = currentUserData?.groupId;

  useEffect(() => {
    const newDate = getInitialDate();
    if (newDate.getTime() !== currentDate.getTime()) {
      setCurrentDate(newDate);
    }
  }, [monthParam]);


  const handleMonthChange = (direction: "next" | "prev") => {
    const newDate = direction === "next" ? addMonths(currentDate, 1) : subMonths(currentDate, 1);
    setCurrentDate(newDate);
    //
  };

  const isLoading = isCurrentUserLoading || isCurrentUserDataLoading;

  if (isLoading) {
    return <Skeleton className="w-full h-96" />
  }

  if (!groupId) {
    return <WelcomeCard />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Monthly Summary for {format(currentDate, "MMMM yyyy")}
          </h1>
          <p className="text-muted-foreground">A summary of your group's activity.</p>
        </div>
        <MonthSwitcher
          currentDate={currentDate}
          onMonthChange={handleMonthChange}
        />
      </div>
      <MonthlySummary month={currentDate} />
    </div>
  );
}
