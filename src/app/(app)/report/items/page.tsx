
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { parseISO, startOfMonth, endOfMonth, format } from "date-fns";
import { useFirebase, useUser, useDoc, useCollection } from "@/firebase";
import { doc, collection, query, where, type Timestamp } from "firebase/firestore";
import type { PurchasedItem } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Users, Package, ChevronLeft } from "lucide-react";
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
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-32 w-full" />
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
        There was a problem fetching the food item analysis. Please try again later.
      </AlertDescription>
    </Alert>
  );
}


export default function FoodItemAnalysisPage() {
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
        currentUser && groupId ? collection(firestore, `groups/${groupId}/members`) : null,
        [firestore, currentUser, groupId]
    );

    const itemsQuery = useMemo(() =>
        currentUser && groupId ? query(
            collection(firestore, `groups/${groupId}/purchasedItems`),
            where("date", ">=", monthDateRange.start),
            where("date", "<=", monthDateRange.end)
        ) : null,
        [firestore, currentUser, groupId, monthDateRange]
    );

    const { data: membersData, isLoading: areMembersLoading, error: membersError } = useCollection(membersQuery);
    const { data: itemsData, isLoading: areItemsLoading, error: itemsError } = useCollection<PurchasedItem>(itemsQuery);

    const isLoading = isCurrentUserLoading || isCurrentUserDataLoading || (!!groupId && (areMembersLoading || areItemsLoading));
    const hasError = currentUserDataError || membersError || itemsError;

    const processedData = useMemo(() => {
        if (!membersData || !itemsData) return null;

        const memberContributions = membersData.map(member => {
            const totalSpent = itemsData
                .filter(item => item.userId === member.id)
                .reduce((sum, item) => sum + item.cost, 0);
            return {
                id: member.id,
                name: member.displayName || member.email.split('@')[0],
                totalSpent,
            };
        });

        const aggregatedItems = itemsData.reduce((acc, item) => {
            if (!acc[item.name]) {
                acc[item.name] = { name: item.name, totalQuantity: 0, totalCost: 0, units: new Set() };
            }
            acc[item.name].totalQuantity += item.quantity;
            acc[item.name].totalCost += item.cost;
            acc[item.name].units.add(item.unit);
            return acc;
        }, {} as Record<string, { name: string, totalQuantity: number, totalCost: number, units: Set<string> }>);

        return {
            memberContributions,
            aggregatedItems: Object.values(aggregatedItems).sort((a, b) => b.totalCost - a.totalCost),
        };

    }, [itemsData, membersData]);

    if (isLoading || (groupId && !processedData)) {
        return <PageSkeleton />;
    }
    
    if (!groupId) {
        return <WelcomeCard />;
    }

    if (hasError) {
        return <DataError />;
    }
    
    const { memberContributions, aggregatedItems } = processedData!;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => router.back()}>
                    <ChevronLeft className="h-6 w-6" />
                    <span className="sr-only">Back</span>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Monthly Food Item Analysis</h1>
                    <p className="text-muted-foreground">A detailed breakdown of food items purchased in {format(month, "MMMM yyyy")}.</p>
                </div>
            </div>

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
    )
}

    