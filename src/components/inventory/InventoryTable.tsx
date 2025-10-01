
"use client";

import { useMemo, useState } from 'react';
import { useCollection, useFirebase, useUser } from '@/firebase';
import { collection, query, where, Timestamp, orderBy } from 'firebase/firestore';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { FoodItem, Purchase } from '@/lib/types';
import { PackageOpen } from 'lucide-react';
import { Button } from '../ui/button';

interface InventoryTableProps {
    groupId: string;
    selectedMonth: Date;
}

interface ProcessedInventoryItem extends FoodItem {
    purchasedQuantity: number;
    remainingQuantity: number;
    totalCost: number;
    avgUnitPrice: number;
    progress: number;
}

function InventorySkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-3/4 mt-2" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-4">
                            <div className="space-y-2 flex-grow">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                            <Skeleton className="h-10 w-24" />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export function InventoryTable({ groupId, selectedMonth }: InventoryTableProps) {
    const { firestore } = useFirebase();

    const inventoryQuery = useMemo(() => 
        (groupId ? query(collection(firestore, `groups/${groupId}/inventory`), orderBy('name', 'asc')) : null),
        [firestore, groupId]
    );

    const monthDateRange = useMemo(() => ({
        start: startOfMonth(selectedMonth),
        end: endOfMonth(selectedMonth),
    }), [selectedMonth]);

    const purchasesQuery = useMemo(() => 
        (groupId ? query(
            collection(firestore, `groups/${groupId}/purchases`),
            where("date", ">=", Timestamp.fromDate(monthDateRange.start)),
            where("date", "<=", Timestamp.fromDate(monthDateRange.end))
        ) : null),
        [firestore, groupId, monthDateRange]
    );

    const { data: inventoryItems, isLoading: areItemsLoading } = useCollection<FoodItem>(inventoryQuery);
    const { data: purchases, isLoading: arePurchasesLoading } = useCollection<Purchase>(purchasesQuery);

    const processedInventory = useMemo((): ProcessedInventoryItem[] => {
        if (!inventoryItems || !purchases) return [];

        return inventoryItems.map(item => {
            const itemPurchases = purchases.filter(p => p.itemId === item.id);
            const purchasedQuantity = itemPurchases.reduce((sum, p) => sum + p.quantity, 0);
            const totalCost = itemPurchases.reduce((sum, p) => sum + p.cost, 0);
            const remainingQuantity = item.requiredQuantity - purchasedQuantity;
            const avgUnitPrice = purchasedQuantity > 0 ? totalCost / purchasedQuantity : 0;
            const progress = item.requiredQuantity > 0 ? (purchasedQuantity / item.requiredQuantity) * 100 : 100;

            return {
                ...item,
                purchasedQuantity,
                remainingQuantity,
                totalCost,
                avgUnitPrice,
                progress,
            };
        });
    }, [inventoryItems, purchases]);

    const isLoading = areItemsLoading || arePurchasesLoading;

    if (isLoading) {
        return <InventorySkeleton />;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Monthly Consumption & Requirements</CardTitle>
                <CardDescription>
                    Track your progress against your monthly grocery requirements.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {processedInventory.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[60%]">Item</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {processedInventory.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <div className="font-medium">{item.name}</div>
                                        <div className="text-sm text-muted-foreground">{item.category}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1.5">
                                            <Progress value={item.progress} className="h-2"/>
                                            <div className="text-xs text-muted-foreground">
                                                <span className="font-semibold text-foreground">{item.purchasedQuantity.toFixed(1)}</span>
                                                / {item.requiredQuantity.toFixed(1)} {item.unit} purchased
                                                (Remaining: <span className="font-semibold">{item.remainingQuantity > 0 ? item.remainingQuantity.toFixed(1) : 0} {item.unit}</span>)
                                            </div>
                                             <div className="text-xs text-muted-foreground">
                                                Total Cost: <span className="font-semibold text-foreground">৳{item.totalCost.toFixed(2)}</span>
                                                {item.avgUnitPrice > 0 && ` (@ ৳${item.avgUnitPrice.toFixed(2)}/${item.unit})`}
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="text-center py-16 text-muted-foreground flex flex-col items-center justify-center">
                        <PackageOpen className="h-10 w-10 mb-4" />
                        <h3 className="text-lg font-semibold">No Inventory Items</h3>
                        <p>Add an item to your inventory list to get started.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

    