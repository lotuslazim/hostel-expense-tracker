
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { parseISO, startOfMonth, endOfMonth, format, addMonths, subMonths } from "date-fns";
import { useFirebase, useUser, useDoc, useCollection } from "@/firebase";
import { doc, collection, query, where } from "firebase/firestore";
import type { Expense } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Users, Zap, Flame } from "lucide-react";
import { WelcomeCard } from "@/components/app/welcome-card";
import { MonthSwitcher } from "@/components/report/month-switcher";

function PageSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-9 w-72" />
                    <Skeleton className="h-4 w-96" />
                </div>
                 <Skeleton className="h-10 w-[330px]" />
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/4" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-48 w-full" />
                </CardContent>
            </Card>
        </div>
    );
}

function DataError() {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Error Loading Data</AlertTitle>
      <AlertDescription>
        There was a problem fetching the utility expense report. Please try again later.
      </AlertDescription>
    </Alert>
  );
}

export default function UtilityExpensesPage() {
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
    
    const currentUserRef = useMemo(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [firestore, currentUser]);
    const { data: currentUserData, isLoading: isCurrentUserDataLoading, error: currentUserDataError } = useDoc(currentUserRef);
    const groupId = currentUserData?.groupId;

    const monthDateRange = useMemo(() => ({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate),
    }), [currentDate]);

    const membersQuery = useMemo(() =>
        (groupId ? collection(firestore, `groups/${groupId}/members`) : null),
        [firestore, groupId]
    );

    const expensesQuery = useMemo(() =>
        (groupId ? query(
            collection(firestore, `groups/${groupId}/expenses`),
            where("date", ">=", monthDateRange.start),
            where("date", "<=", monthDateRange.end),
            where("category", "in", ["Electricity", "Gas"])
        ) : null),
        [firestore, groupId, monthDateRange]
    );

    const { data: membersData, isLoading: areMembersLoading, error: membersError } = useCollection(membersQuery);
    const { data: expensesData, isLoading: areExpensesLoading, error: expensesError } = useCollection<Expense>(expensesQuery);

    const processedData = useMemo(() => {
        if (!membersData || !expensesData) {
            return { memberContributions: [] };
        }

        const memberContributions = membersData.map(member => {
            const electricityPaid = expensesData
                .filter(expense => expense.userId === member.id && expense.category === 'Electricity')
                .reduce((sum, expense) => sum + expense.amount, 0);
            const gasPaid = expensesData
                .filter(expense => expense.userId === member.id && expense.category === 'Gas')
                .reduce((sum, expense) => sum + expense.amount, 0);
            
            return {
                id: member.id,
                name: member.displayName || member.email.split('@')[0],
                electricityPaid,
                gasPaid,
            };
        });

        return { memberContributions };

    }, [expensesData, membersData]);

    const handleMonthChange = (direction: "next" | "prev") => {
        const newDate = direction === "next" ? addMonths(currentDate, 1) : subMonths(currentDate, 1);
        const newUrl = `/report/utilities?month=${format(newDate, 'yyyy-MM')}`;
        router.push(newUrl, { scroll: false });
    };

    const isLoading = isCurrentUserLoading || isCurrentUserDataLoading;
    if (isLoading) {
        return <PageSkeleton />;
    }
    
    if (!groupId) {
        return <WelcomeCard />;
    }

    const isDataLoading = areMembersLoading || areExpensesLoading;
    const hasError = currentUserDataError || membersError || expensesError;
    
    if (isDataLoading) return <PageSkeleton />;
    if (hasError) return <DataError />;
    
    const { memberContributions } = processedData;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Monthly Utility Expenses</h1>
                    <p className="text-muted-foreground">A breakdown of utility bills paid by each member in {format(currentDate, "MMMM yyyy")}.</p>
                </div>
                <MonthSwitcher currentDate={currentDate} onMonthChange={handleMonthChange} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Member Contributions</CardTitle>
                    <CardDescription>How much each member contributed towards utility bills this month.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Member</TableHead>
                                <TableHead className="text-right">Electricity Paid</TableHead>
                                <TableHead className="text-right">Gas Paid</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {memberContributions.length > 0 ? memberContributions.map(member => (
                                <TableRow key={member.id}>
                                    <TableCell className="font-medium">{member.name}</TableCell>
                                    <TableCell className="text-right font-semibold">৳{member.electricityPaid.toFixed(2)}</TableCell>
                                    <TableCell className="text-right font-semibold">৳{member.gasPaid.toFixed(2)}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
                                         <div className="flex flex-col items-center gap-2">
                                            <Users className="h-8 w-8 text-muted-foreground" />
                                            <p className="text-muted-foreground">No utility expenses logged this month.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

        </div>
    )
}
