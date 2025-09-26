
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { useState, useEffect } from "react";
import { useFirebase, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { getMonthlyGroupData } from "@/ai/flows/get-monthly-group-data";
import type { MonthlyGroupData } from "@/ai/schemas";
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

    const [groupData, setGroupData] = useState<MonthlyGroupData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const targetDate = monthParam ? parseISO(monthParam) : new Date();

    useEffect(() => {
        if (groupId) {
            setIsLoading(true);
            getMonthlyGroupData({ groupId, date: targetDate.toISOString() })
                .then(data => {
                    setGroupData(data);
                    setError(null);
                })
                .catch(err => {
                    console.error("Failed to fetch monthly data:", err);
                    setError("Could not load food expense data.");
                })
                .finally(() => {
                    setIsLoading(false);
                });
        } else if (!isCurrentUserLoading && !isCurrentUserDataLoading) {
            setIsLoading(false);
        }
    }, [groupId, targetDate, isCurrentUserLoading, isCurrentUserDataLoading]);
    
    const dataLoading = isLoading || isCurrentUserLoading || isCurrentUserDataLoading;

    if (dataLoading) {
        return <ItemsSkeleton />;
    }
    
    if (error) {
        return <Card><CardContent><p className="text-center text-destructive py-8">{error}</p></CardContent></Card>;
    }
    
    const monthQueryParam = monthParam ? `?month=${monthParam}` : '';
    const members = groupData?.members ?? [];
    
    const memberFoodExpenses = members.map(member => ({
        id: member.id,
        name: member.name,
        foodExpense: member.expenses.food,
    }));


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
