
"use client";

import { useSearchParams, useRouter, useParams } from "next/navigation";
import { useMemo } from "react";
import { parseISO, startOfMonth, endOfMonth, format } from "date-fns";
import { useFirebase, useUser, useDoc, useCollection } from "@/firebase";
import { doc, collection, query, where, type Timestamp } from "firebase/firestore";
import type { Expense } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, ChevronLeft, User, Zap } from "lucide-react";
import { WelcomeCard } from "@/components/app/welcome-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Member {
  id: string;
  displayName?: string;
  email: string;
}

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
        There was a problem fetching the member's utility data. Please try again later.
      </AlertDescription>
    </Alert>
  );
}


export default function MemberUtilityDetailsPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const params = useParams();

    const memberId = params.memberId as string;
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
    
    const memberRef = useMemo(() => 
        (groupId && memberId ? doc(firestore, `groups/${groupId}/members`, memberId) : null), 
        [firestore, groupId, memberId]
    );

    const monthDateRange = useMemo(() => ({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate),
    }), [currentDate]);


    const expensesQuery = useMemo(() =>
        (groupId && memberId ? query(
            collection(firestore, `groups/${groupId}/expenses`),
            where("userId", "==", memberId),
            where("date", ">=", monthDateRange.start),
            where("date", "<=", monthDateRange.end),
            where("category", "in", ["Electricity", "Gas"])
        ) : null),
        [firestore, groupId, memberId, monthDateRange]
    );
    
    const { data: memberData, isLoading: isMemberLoading, error: memberError } = useDoc<Member>(memberRef);
    const { data: expensesData, isLoading: areExpensesLoading, error: expensesError } = useCollection<Expense>(expensesQuery);

    const sortedExpenses = useMemo(() => {
        if (!expensesData) return [];
        return [...expensesData].sort((a, b) => (b.date as Timestamp).toDate().getTime() - (a.date as Timestamp).toDate().getTime());
    }, [expensesData]);


    const isLoading = isCurrentUserLoading || isCurrentUserDataLoading;
    if (isLoading) {
        return <PageSkeleton />;
    }
    
    if (!groupId) {
        return <WelcomeCard />;
    }

    const isDataLoading = isMemberLoading || areExpensesLoading;
    const hasError = currentUserDataError || memberError || expensesError;
    
    if (isDataLoading) return <PageSkeleton />;
    if (hasError) return <DataError />;
    
    const memberName = memberData?.displayName || memberData?.email?.split('@')[0] || 'Member';

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Back</span>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Utility Payments for {memberName}</h1>
                    <p className="text-muted-foreground">Showing expenses logged in {format(currentDate, "MMMM yyyy")}.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5" /> Expense Log</CardTitle>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedExpenses.length > 0 ? sortedExpenses.map((expense) => (
                                <TableRow key={expense.id}>
                                    <TableCell className="font-medium">{format((expense.date as Timestamp).toDate(), 'MMMM d, yyyy')}</TableCell>
                                    <TableCell><Badge variant="outline">{expense.category}</Badge></TableCell>
                                    <TableCell>{expense.description || "N/A"}</TableCell>
                                    <TableCell className="text-right font-semibold">৳{expense.amount.toFixed(2)}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                         <div className="flex flex-col items-center gap-2">
                                            <User className="h-8 w-8 text-muted-foreground" />
                                            <p className="text-muted-foreground">No utility expenses were logged by {memberName} this month.</p>
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
