
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { parseISO, startOfMonth, endOfMonth, format, addMonths, subMonths } from "date-fns";
import { useFirebase, useUser, useDoc, useCollection } from "@/firebase";
import { doc, collection, query, where, Timestamp } from "firebase/firestore";
import type { PurchasedItem, Expense } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Users, Package, ChevronLeft } from "lucide-react";
import { WelcomeCard } from "@/components/app/welcome-card";
import { Button } from "@/components/ui/button";
import { MonthSwitcher } from "@/components/report/month-switcher";
import { AddPurchasedItemCard } from "@/components/report/AddPurchasedItemCard";

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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <Skeleton className="h-96 w-full" />
                </div>
                <div className="lg:col-span-2 space-y-6">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-96 w-full" />
                </div>
            </div>
        </div>
    );
}

function DataError() {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Error Loading Data</AlertTitle>
      <AlertDescription>
        There was a problem fetching the food item analysis. Please try again later.
      </AlertDescription>
    </Alert>
  );
}

export default function FoodItemAnalysisPage() {
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

    const monthStartTimestamp = useMemo(() => 
        Timestamp.fromDate(monthDateRange.start), [monthDateRange.start]);
    const monthEndTimestamp = useMemo(() => 
        Timestamp.fromDate(monthDateRange.end), [monthDateRange.end]);

    const membersQuery = useMemo(() =>
        (groupId ? collection(firestore, `groups/${groupId}/members`) : null),
        [firestore, groupId]
    );

    const itemsQuery = useMemo(() =>
        (groupId ? query(
            collection(firestore, `groups/${groupId}/purchasedItems`),
            where("date", ">=", monthStartTimestamp),
            where("date", "<=", monthEndTimestamp)
        ) : null),
        [firestore, groupId, monthStartTimestamp, monthEndTimestamp]
    );
    
    const expensesQuery = useMemo(() =>
        (groupId ? query(
            collection(firestore, `groups/${groupId}/expenses`),
            where("date", ">=", monthStartTimestamp),
            where("date", "<=", monthEndTimestamp),
            where("category", "in", ["Food & Groceries", "Other"])
        ) : null),
        [firestore, groupId, monthStartTimestamp, monthEndTimestamp]
    );

    const { data: membersData, isLoading: areMembersLoading, error: membersError } = useCollection(membersQuery);
    const { data: itemsData, isLoading: areItemsLoading, error: itemsError } = useCollection<PurchasedItem>(itemsQuery);
    const { data: expensesData, isLoading: areExpensesLoading, error: expensesError } = useCollection<Expense>(expensesQuery);

    const processedData = useMemo(() => {
        if (!membersData) {
            return { memberContributions: [], aggregatedItems: [] };
        }

        const memberContributions = membersData.map(member => {
            const itemsCost = (itemsData || [])
                .filter(item => item.userId === member.id)
                .reduce((sum, item) => sum + item.cost, 0);
            
            const expensesCost = (expensesData || [])
                .filter(expense => expense.userId === member.id)
                .reduce((sum, expense) => sum + expense.amount, 0);

            const totalSpent = itemsCost + expensesCost;

            return {
                id: member.id,
                name: member.displayName || member.email?.split("@")[0] || "Unknown",
                totalSpent
            };
        });

        const aggregatedItems = Object.values(
            (itemsData || []).reduce((acc, item) => {
                if (!acc[item.name]) {
                    acc[item.name] = {
                        name: item.name,
                        totalQuantity: 0,
                        totalCost: 0,
                        units: new Set<string>()
                    };
                }
                acc[item.name].totalQuantity += item.quantity;
                acc[item.name].totalCost += item.cost;
                acc[item.name].units.add(item.unit);
                return acc;
            }, {} as Record<string, { name: string; totalQuantity: number; totalCost: number; units: Set<string> }>)
        ).sort((a, b) => b.totalCost - a.totalCost);

        return { memberContributions, aggregatedItems };
    }, [membersData, itemsData, expensesData]);


    const handleMonthChange = (direction: "next" | "prev") => {
        const newDate = direction === "next" ? addMonths(currentDate, 1) : subMonths(currentDate, 1);
        const newUrl = `/report/items?month=${format(newDate, 'yyyy-MM')}`;
        router.push(newUrl, { scroll: false });
    };

    const isLoading = isCurrentUserLoading || isCurrentUserDataLoading;
    if (isLoading) {
        return <PageSkeleton />;
    }
    
    if (!groupId) {
        return <WelcomeCard />;
    }

    const isDataLoading = areMembersLoading || areItemsLoading || areExpensesLoading;
    const hasError = currentUserDataError || membersError || itemsError || expensesError;
    
    if (isDataLoading) return <PageSkeleton />;
    if (hasError) return <DataError />;
    
    const { memberContributions, aggregatedItems } = processedData;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                     <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight font-headline">Monthly Food Item Analysis</h1>
                        <p className="text-muted-foreground">A detailed breakdown of food items purchased in {format(currentDate, "MMMM yyyy")}.</p>
                    </div>
                </div>
                <MonthSwitcher currentDate={currentDate} onMonthChange={handleMonthChange} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <AddPurchasedItemCard />
                </div>
                 <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Food Expense by Member</CardTitle>
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
                                {memberContributions.length > 0 ? memberContributions.map(member => (
                                    <TableRow key={member.id}>
                                        <TableCell className="font-medium">{member.name}</TableCell>
                                        <TableCell className="text-right font-semibold">৳{member.totalSpent.toFixed(2)}</TableCell>
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

                    <Card>
                        <CardHeader>
                            <CardTitle>Aggregated Item Summary</CardTitle>
                            <CardDescription>This card calculates the total quantity of each food item and their expense.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item</TableHead>
                                        <TableHead>Total Quantity</TableHead>
                                        <TableHead className="text-right">Total Cost</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {aggregatedItems.length > 0 ? aggregatedItems.map(item => (
                                        <TableRow key={item.name}>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell>{item.totalQuantity.toFixed(2)} {Array.from(item.units).join(', ')}</TableCell>
                                            <TableCell className="text-right font-semibold">৳{item.totalCost.toFixed(2)}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-24 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Package className="h-8 w-8 text-muted-foreground" />
                                                    <p className="text-muted-foreground">No food items were purchased this month.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

    