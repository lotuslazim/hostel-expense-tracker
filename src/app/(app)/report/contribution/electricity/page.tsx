
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { parseISO, startOfMonth, endOfMonth, format } from "date-fns";
import { useFirebase, useUser, useDoc, useCollection } from "@/firebase";
import { doc, collection, query, where, type Timestamp } from "firebase/firestore";
import type { Expense } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Users, ChevronLeft, Zap } from "lucide-react";
import { WelcomeCard } from "@/components/app/welcome-card";
import { Button } from "@/components/ui/button";

function PageSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                 <Skeleton className="h-10 w-10" />
                <div>
                    <Skeleton className="h-9 w-72" />
                    <Skeleton className="h-4 w-96 mt-2" />
                </div>
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/3" />
                     <Skeleton className="h-4 w-2/3 mt-2" />
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
        There was a problem fetching the contribution analysis. Please try again later.
      </AlertDescription>
    </Alert>
  );
}


export default function ElectricityContributionPage() {
    // 1. ALL HOOKS MUST BE CALLED FIRST - UNCONDITIONALLY
    const searchParams = useSearchParams();
    const router = useRouter();
    const monthParam = searchParams.get('month');

    const { firestore } = useFirebase();
    const { user: currentUser, isUserLoading: isCurrentUserLoading } = useUser();

    const month = useMemo(() => {
        return monthParam ? startOfMonth(parseISO(monthParam)) : startOfMonth(new Date());
    }, [monthParam]);

    const currentUserRef = useMemo(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [firestore, currentUser]);
    const { data: currentUserData, isLoading: isCurrentUserDataLoading, error: currentUserDataError } = useDoc(currentUserRef);
    const groupId = currentUserData?.groupId;

    const monthDateRange = useMemo(() => ({
        start: startOfMonth(month),
        end: endOfMonth(month),
    }), [month]);

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

    const { data: membersData, isLoading: areMembersLoading, error: membersError } = useCollection(membersQuery);
    const { data: expensesData, isLoading: areExpensesLoading, error: expensesError } = useCollection<Expense>(expensesQuery);
    
    // ✅ ADD processedData useMemo HERE - BEFORE ANY CONDITIONALS
    const processedData = useMemo(() => {
        if (!membersData || !expensesData) {
             return { memberContributions: [], totalElectricityExpense: 0 };
        };
    
        const totalElectricityExpense = expensesData.reduce((sum, expense) => sum + expense.amount, 0);
    
        const memberContributions = membersData.map(member => {
            const totalSpent = expensesData
                .filter(expense => expense.userId === member.id)
                .reduce((sum, expense) => sum + expense.amount, 0);
            return {
                id: member.id,
                name: member.displayName || member.email.split('@')[0],
                totalSpent,
            };
        });
    
        return {
            memberContributions,
            totalElectricityExpense,
        };
    }, [membersData, expensesData]);
    // ✅ END of processedData useMemo
    
    // THEN your conditionals can start here:
    const isLoading = isCurrentUserLoading || isCurrentUserDataLoading;
    if (isLoading) {
        return <PageSkeleton />;
    }
    // ... rest of your conditionals
    
    if (!groupId) {
        return <WelcomeCard />;
    }

    const isDataLoading = areMembersLoading || areExpensesLoading;
    const hasError = currentUserDataError || membersError || expensesError;

    if (isDataLoading) return <PageSkeleton />;
    if (hasError) return <DataError />;
    
    const { memberContributions, totalElectricityExpense } = processedData;

    // 3. RENDER JSX
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => router.back()}>
                        <ChevronLeft className="h-6 w-6" />
                        <span className="sr-only">Back</span>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight font-headline">Monthly Electricity Contribution</h1>
                        <p className="text-muted-foreground">A breakdown of who paid for electricity in {format(month, "MMMM yyyy")}.</p>
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Contribution by Member</CardTitle>
                    <CardDescription>Total electricity bill for the month was <span className="font-bold">৳{totalElectricityExpense.toFixed(2)}</span>.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Member</TableHead>
                                <TableHead className="text-right">Amount Paid</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                           {memberContributions.length > 0 ? memberContributions.map(member => (
                               <TableRow key={member.id}>
                                   <TableCell className="font-medium">{member.name}</TableCell>
                                   <TableCell className="text-right font-semibold">
                                       {totalElectricityExpense > 0 ? `৳${member.totalSpent.toFixed(2)}` : "None"}
                                   </TableCell>
                               </TableRow>
                           )) : (
                                <TableRow>
                                    <TableCell colSpan={2} className="h-24 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Users className="h-8 w-8 text-muted-foreground" />
                                            <p className="text-muted-foreground">No member data available.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                           )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

             {totalElectricityExpense === 0 && (
                <Alert>
                    <Zap className="h-4 w-4" />
                    <AlertTitle>No Expenses Logged</AlertTitle>
                    <AlertDescription>
                        There were no electricity expenses logged for {format(month, "MMMM yyyy")}.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    )
}
