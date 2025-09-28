
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { useMemo } from "react";
import { useFirebase, useUser, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, where } from "firebase/firestore";
import type { Expense } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

function ItemsSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10" />
                <div>
                    <Skeleton className="h-9 w-64 mb-2" />
                    <Skeleton className="h-4 w-80" />
                </div>
            </div>
            <Card>
                <CardHeader>
                     <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5"/>
                        <Skeleton className="h-6 w-56" />
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-48 w-full" />
                </CardContent>
            </Card>
        </div>
    );
}


export default function MonthlyItemsPage() {
    const searchParams = useSearchParams();
    const monthParam = searchParams.get('month');
    
    const { firestore } = useFirebase();
    const { user: currentUser, isUserLoading: isCurrentUserLoading } = useUser();
    
    const currentUserRef = useMemoFirebase(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [firestore, currentUser]);
    const { data: currentUserData, isLoading: isCurrentUserDataLoading } = useDoc(currentUserRef);
    const groupId = currentUserData?.groupId;

    const targetDate = monthParam ? parseISO(monthParam) : new Date();
    const monthDateRange = useMemo(() => {
        return {
          start: startOfMonth(targetDate),
          end: endOfMonth(targetDate),
        };
    }, [targetDate]);

    const membersQuery = useMemoFirebase(() =>
        groupId ? collection(firestore, `groups/${groupId}/members`) : null,
        [firestore, groupId]
    );

    const expensesQuery = useMemoFirebase(() =>
        groupId ? query(
        collection(firestore, `groups/${groupId}/expenses`),
        where("date", ">=", monthDateRange.start),
        where("date", "<=", monthDateRange.end),
        where("category", "==", "Food")
        ) : null,
        [firestore, groupId, monthDateRange]
    );

    const { data: members, isLoading: areMembersLoading } = useCollection(membersQuery);
    const { data: expenses, isLoading: areExpensesLoading } = useCollection<Expense>(expensesQuery);
    
    const dataLoading = isCurrentUserLoading || isCurrentUserDataLoading || areMembersLoading || areExpensesLoading;

    if (dataLoading) {
        return <ItemsSkeleton />;
    }

    const monthQueryParam = monthParam ? `?month=${monthParam}` : '';
    
    const memberFoodExpenses = (members || []).map(member => {
        const foodExpense = (expenses || [])
            .filter(e => e.userId === member.id)
            .reduce((sum, e) => sum + e.amount, 0);

        return {
            id: member.id,
            name: member.displayName || member.email.split('@')[0],
            foodExpense,
        };
    });


  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
                <Link href={`/report${monthQueryParam}`}><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight font-headline">
                Monthly Food Expenses
              </h1>
              <p className="text-muted-foreground">
                Breakdown of food expenses for {format(targetDate, "MMMM yyyy")}.
              </p>
            </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5"/>
                    Food Expense by Member
                </CardTitle>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Member</TableHead>
                            <TableHead className="text-right">Food Expense</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {memberFoodExpenses.length > 0 ? memberFoodExpenses.map((member) => (
                            <TableRow key={member.id}>
                                <TableCell className="font-medium">{member.name}</TableCell>
                                <TableCell className="text-right">৳{member.foodExpense.toFixed(2)}</TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center h-24">
                                    No food expenses logged for this month.
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

    