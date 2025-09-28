
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Users, ShoppingCart, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { useMemo } from "react";
import { useFirebase, useUser, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, where } from "firebase/firestore";
import type { PurchasedItem } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function ItemsSkeleton() {
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
                     <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-muted-foreground"/>
                        <Skeleton className="h-6 w-56" />
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <Skeleton className="h-48 w-full" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                     <CardTitle className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5 text-muted-foreground"/>
                        <Skeleton className="h-6 w-56" />
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
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

export default function MonthlyItemsPage() {
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

    const membersQuery = useMemoFirebase(() =>
        groupId ? collection(firestore, `groups/${groupId}/members`) : null,
        [firestore, groupId]
    );

    const itemsQuery = useMemoFirebase(() =>
        groupId ? query(
        collection(firestore, `groups/${groupId}/purchasedItems`),
        where("date", ">=", monthDateRange.start),
        where("date", "<=", monthDateRange.end)
        ) : null,
        [firestore, groupId, monthDateRange]
    );

    const { data: members, isLoading: areMembersLoading, error: membersError } = useCollection(membersQuery);
    const { data: items, isLoading: areItemsLoading, error: itemsError } = useCollection<PurchasedItem>(itemsQuery);
    
    const isLoading = isCurrentUserLoading || isCurrentUserDataLoading || areMembersLoading || areItemsLoading;
    const hasError = currentUserDataError || membersError || itemsError;

    if (isLoading) {
        return <ItemsSkeleton />;
    }

    if (hasError) {
      return <DataError />;
    }

    if (!currentUserData || !members || !items) {
        return (
            <Card>
                <CardContent>
                    <p className="text-center text-muted-foreground py-8">
                        Data could not be fully loaded. This might be due to a temporary connection issue.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const monthQueryParam = monthParam ? `?month=${monthParam}` : '';
    
    const memberFoodExpenses = members.map(member => {
        const foodExpense = items
            .filter(item => item.userId === member.id)
            .reduce((sum, item) => sum + item.cost, 0);

        return {
            id: member.id,
            name: member.displayName || member.email.split('@')[0],
            foodExpense,
        };
    });
    
    const aggregatedItems = items.reduce((acc, item) => {
        const key = `${item.name.trim().toLowerCase()}_${item.unit.trim().toLowerCase()}`;
        if (!acc[key]) {
            acc[key] = {
                name: item.name,
                unit: item.unit,
                totalQuantity: 0,
                totalCost: 0,
            };
        }
        acc[key].totalQuantity += item.quantity;
        acc[key].totalCost += item.cost;
        return acc;
    }, {} as Record<string, { name: string; unit: string; totalQuantity: number; totalCost: number; }>);
    
    const sortedAggregatedItems = Object.values(aggregatedItems).sort((a, b) => b.totalCost - a.totalCost);


  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
                <Link href={`/report${monthQueryParam}`}><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight font-headline">
                Monthly Food Item Analysis
              </h1>
              <p className="text-muted-foreground">
                A detailed breakdown of food items purchased in {format(targetDate, "MMMM yyyy")}.
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
                            <TableHead className="text-right">Total Spent on Food</TableHead>
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

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5"/>
                    Aggregated Item Summary
                </CardTitle>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead className="text-center">Total Quantity</TableHead>
                            <TableHead className="text-right">Total Cost</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedAggregatedItems.length > 0 ? sortedAggregatedItems.map((item) => (
                            <TableRow key={item.name + item.unit}>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell className="text-center">{item.totalQuantity.toLocaleString()} {item.unit}</TableCell>
                                <TableCell className="text-right">৳{item.totalCost.toFixed(2)}</TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center h-24">
                                    No individual food items were logged this month.
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
