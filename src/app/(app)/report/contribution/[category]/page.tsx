
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Zap, Flame, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { notFound, useSearchParams, useParams } from "next/navigation";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { useMemo } from "react";
import { useFirebase, useUser, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, where } from "firebase/firestore";
import type { Expense } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


const categoryDetails: Record<string, { icon: React.ReactNode, key: 'electricity' | 'gas', name: 'Electricity' | 'Gas' }> = {
    electricity: { icon: <Zap className="h-5 w-5"/>, key: 'electricity', name: 'Electricity' },
    gas: { icon: <Flame className="h-5 w-5"/>, key: 'gas', name: 'Gas' },
};

function ContributionSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-md" />
                <div>
                    <Skeleton className="h-9 w-64 mb-2" />
                    <Skeleton className="h-4 w-80" />
                </div>
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-7 w-72" />
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
      <AlertTitle>Error Loading Report</AlertTitle>
      <AlertDescription>
        There was a problem fetching the data for this report. Please try again later.
      </AlertDescription>
    </Alert>
  )
}

export default function ContributionPage() {
    const params = useParams();
    const category = params.category as string;
    const searchParams = useSearchParams();
    const monthParam = searchParams.get('month');
    
    const { firestore } = useFirebase();
    const { user: currentUser, isUserLoading: isCurrentUserLoading } = useUser();
    
    const currentUserRef = useMemoFirebase(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [firestore, currentUser]);
    const { data: currentUserData, isLoading: isCurrentUserDataLoading, error: currentUserDataError } = useDoc(currentUserRef);
    const groupId = currentUserData?.groupId;

    const targetDate = monthParam ? parseISO(monthParam) : new Date();

    const monthDateRange = useMemo(() => {
        return {
          start: startOfMonth(targetDate),
          end: endOfMonth(targetDate),
        };
    }, [targetDate]);

    const details = categoryDetails[category];
    
    const membersQuery = useMemoFirebase(() =>
        groupId ? collection(firestore, `groups/${groupId}/members`) : null,
        [firestore, groupId]
    );

    const expensesQuery = useMemoFirebase(() =>
        (groupId && details) ? query(
        collection(firestore, `groups/${groupId}/expenses`),
        where("date", ">=", monthDateRange.start),
        where("date", "<=", monthDateRange.end),
        where("category", "==", details.name)
        ) : null,
        [firestore, groupId, monthDateRange, details]
    );

    const { data: members, isLoading: areMembersLoading, error: membersError } = useCollection(membersQuery);
    const { data: expenses, isLoading: areExpensesLoading, error: expensesError } = useCollection<Expense>(expensesQuery);

    if (!details) {
        notFound();
    }

    const isLoading = isCurrentUserLoading || isCurrentUserDataLoading || areMembersLoading || areExpensesLoading;
    const hasError = currentUserDataError || membersError || expensesError;

    if (isLoading) {
        return <ContributionSkeleton />;
    }

    if (hasError) {
      return <DataError />;
    }
    
    const contributions = (members || []).map(member => {
        const amount = (expenses || [])
            .filter(e => e.userId === member.id)
            .reduce((sum, e) => sum + e.amount, 0);

        return {
            id: member.id,
            name: member.displayName || member.email.split('@')[0],
            amount: amount
        };
    });
    
    const monthQueryParam = monthParam ? `?month=${monthParam}` : '';

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
                <Link href={`/report${monthQueryParam}`}><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight font-headline capitalize">
                Monthly {category} Contributions
              </h1>
              <p className="text-muted-foreground">
                Breakdown of {category} payments for {format(targetDate, "MMMM yyyy")}.
              </p>
            </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 capitalize">
                    {details.icon}
                    {category} Contribution per Member
                </CardTitle>
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
                        {contributions.length > 0 ? contributions.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell className="text-right">৳{item.amount.toFixed(2)}</TableCell>
                            </TableRow>
                        )) : (
                             <TableRow>
                                <TableCell colSpan={2} className="text-center h-24">
                                    No contributions logged for this category this month.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}

    
