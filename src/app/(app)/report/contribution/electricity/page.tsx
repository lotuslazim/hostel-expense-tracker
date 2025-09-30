
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { parseISO, startOfMonth, endOfMonth, format, addMonths, subMonths } from "date-fns";
import { useFirebase, useUser, useDoc, useCollection } from "@/firebase";
import { doc, collection, query, where, type Timestamp } from "firebase/firestore";
import type { Expense } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, ChevronLeft, Zap, Users } from "lucide-react";
import { WelcomeCard } from "@/components/app/welcome-card";
import { Button } from "@/components/ui/button";
import { MonthSwitcher } from "@/components/report/month-switcher";

// Define a specific type for member data used in this page
interface Member {
  id: string;
  displayName?: string;
  email: string;
}

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
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/3" />
                </CardHeader>
                <CardContent>
                     <Skeleton className="h-20 w-full" />
                </CardContent>
            </Card>
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
        There was a problem fetching the electricity contribution analysis. Please try again later.
      </AlertDescription>
    </Alert>
  );
}


export default function ElectricityContributionPage() {
    // 1. ALL HOOKS CALLED UNCONDITIONALLY AT THE TOP
    const searchParams = useSearchParams();
    const router = useRouter();
    const monthParam = searchParams.get('month');

    const getInitialDate = () => {
        if (monthParam) {
            try {
                // Appends '-01' to handle 'yyyy-MM' format from URL
                return startOfMonth(parseISO(`${monthParam}-01`));
            } catch (e) {
                return startOfMonth(new Date());
            }
        }
        return startOfMonth(new Date());
    };

    const [currentDate, setCurrentDate] = useState(getInitialDate);
    const { firestore } = useFirebase();
    const { user: currentUser, isUserLoading: isCurrentUserLoading } = useUser();
    
    useEffect(() => {
        const newDate = getInitialDate();
        if (newDate.getTime() !== currentDate.getTime()) {
            setCurrentDate(newDate);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [monthParam]);

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
            where("category", "==", "Electricity")
        ) : null),
        [firestore, groupId, monthDateRange]
    );

    const { data: membersData, isLoading: areMembersLoading, error: membersError } = useCollection<Member>(membersQuery);
    const { data: expensesData, isLoading: areExpensesLoading, error: expensesError } = useCollection<Expense>(expensesQuery);

    const processedData = useMemo(() => {
        if (!membersData || !expensesData) {
            return { totalElectricityExpense: 0, memberContributions: [] };
        }

        const totalElectricityExpense = expensesData.reduce((sum, expense) => sum + expense.amount, 0);

        const memberContributions = membersData.map(member => {
            const totalSpent = expensesData
                .filter(expense => expense.userId === member.id)
                .reduce((sum, expense) => sum + expense.amount, 0);
            
            const percentage = totalElectricityExpense > 0 ? (totalSpent / totalElectricityExpense) * 100 : 0;

            return {
                id: member.id,
                name: member.displayName || member.email.split('@')[0],
                totalSpent,
                percentage,
            };
        });

        return {
            totalElectricityExpense,
            memberContributions,
        };

    }, [expensesData, membersData]);

    const handleMonthChange = (direction: "next" | "prev") => {
        const newDate = direction === "next" ? addMonths(currentDate, 1) : subMonths(currentDate, 1);
        setCurrentDate(newDate);
        const newUrl = `/report/contribution/electricity?month=${format(newDate, 'yyyy-MM')}`;
        router.push(newUrl, { scroll: false });
    };

    // 2. CONDITIONAL RETURNS COME AFTER ALL HOOKS
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
    
    const { totalElectricityExpense, memberContributions } = processedData;

    // 3. YOUR COMPONENT JSX
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                     <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight font-headline">Electricity Contribution</h1>
                        <p className="text-muted-foreground">A breakdown of electricity bill payments for {format(currentDate, "MMMM yyyy")}.</p>
                    </div>
                </div>
                <MonthSwitcher currentDate={currentDate} onMonthChange={handleMonthChange} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5" /> Monthly Total</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-4xl font-bold">৳{totalElectricityExpense.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">Total electricity expense paid by all members this month.</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Member Contributions</CardTitle>
                    <CardDescription>Details of who paid what towards the electricity bill.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Member</TableHead>
                                <TableHead className="text-right">Total Paid</TableHead>
                                <TableHead className="w-[150px] text-right">Contribution %</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {memberContributions.length > 0 ? memberContributions.map(member => (
                                <TableRow key={member.id}>
                                    <TableCell className="font-medium">{member.name}</TableCell>
                                    <TableCell className="text-right font-semibold">৳{member.totalSpent.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">{member.percentage.toFixed(2)}%</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
                                         <div className="flex flex-col items-center gap-2">
                                            <Users className="h-8 w-8 text-muted-foreground" />
                                            <p className="text-muted-foreground">No electricity payments logged this month.</p>
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
