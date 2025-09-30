
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { parseISO, startOfMonth, endOfMonth, format, addMonths, subMonths } from "date-fns";
import { useFirebase, useUser, useDoc, useCollection } from "@/firebase";
import { doc, collection, query, where, type Timestamp } from "firebase/firestore";
import type { Expense } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Users, ChevronLeft, Zap, Flame } from "lucide-react";
import { WelcomeCard } from "@/components/app/welcome-card";
import { Button } from "@/components/ui/button";
import { MonthSwitcher } from "@/components/report/month-switcher";

function PageSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10" />
                    <div>
                        <Skeleton className="h-9 w-72" />
                        <Skeleton className="h-4 w-96 mt-2" />
                    </div>
                </div>
                 <Skeleton className="h-10 w-[330px]" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
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


export default function UtilityReportPage() {
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
            return { memberContributions: [], totalElectricity: 0, totalGas: 0 };
        };

        const totalElectricity = expensesData
            .filter(e => e.category === 'Electricity')
            .reduce((sum, e) => sum + e.amount, 0);
        
        const totalGas = expensesData
            .filter(e => e.category === 'Gas')
            .reduce((sum, e) => sum + e.amount, 0);

        const memberContributions = membersData.map(member => {
            const electricityPaid = expensesData
                .filter(e => e.userId === member.id && e.category === 'Electricity')
                .reduce((sum, e) => sum + e.amount, 0);
            const gasPaid = expensesData
                .filter(e => e.userId === member.id && e.category === 'Gas')
                .reduce((sum, e) => sum + e.amount, 0);

            return {
                id: member.id,
                name: member.displayName || member.email.split('@')[0],
                electricityPaid,
                gasPaid,
            };
        });

        return { memberContributions, totalElectricity, totalGas };

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
    
    const { memberContributions, totalElectricity, totalGas } = processedData;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                     <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight font-headline">Monthly Utility Expenses</h1>
                        <p className="text-muted-foreground">A breakdown of utility bills for {format(currentDate, "MMMM yyyy")}.</p>
                    </div>
                </div>
                <MonthSwitcher currentDate={currentDate} onMonthChange={handleMonthChange} />
            </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Electricity Bill</CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">৳{totalElectricity.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Gas Bill</CardTitle>
                        <Flame className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">৳{totalGas.toFixed(2)}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Member Contributions</CardTitle>
                    <CardDescription>How much each member contributed to utility bills this month.</CardDescription>
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
                                            <p className="text-muted-foreground">No utility expenses were logged this month.</p>
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
