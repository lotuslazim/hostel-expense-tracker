
"use client";

import { MonthlySummary } from "@/components/report/monthly-summary";
import { useMemo } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import { startOfMonth, format, addMonths, subMonths, parseISO } from "date-fns";
import { MonthSwitcher } from "@/components/report/month-switcher";
import { useUser, useDoc, useFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { WelcomeCard } from "@/components/app/welcome-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReportPage() {
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

  const { firestore } = useFirebase();
  const { user: currentUser, isUserLoading: isCurrentUserLoading } = useUser();

  const currentUserRef = useMemo(
    () => (currentUser ? doc(firestore, "users", currentUser.uid) : null),
    [firestore, currentUser]
  );
  const { data: currentUserData, isLoading: isCurrentUserDataLoading } =
    useDoc(currentUserRef);
  const groupId = currentUserData?.groupId;
  
  const handleMonthChange = (direction: "next" | "prev") => {
    const newDate = direction === "next" ? addMonths(currentDate, 1) : subMonths(currentDate, 1);
    const newUrl = `/report?month=${format(newDate, 'yyyy-MM')}`;
    router.push(newUrl, { scroll: false });
  };

  const isLoading = isCurrentUserLoading || isCurrentUserDataLoading;

  if (isLoading) {
    return (
       <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
                <Skeleton className="h-9 w-80" />
                <Skeleton className="h-4 w-64 mt-2" />
            </div>
            <Skeleton className="h-10 w-[330px]" />
        </div>
        <Skeleton className="w-full h-96" />
       </div>
    )
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
