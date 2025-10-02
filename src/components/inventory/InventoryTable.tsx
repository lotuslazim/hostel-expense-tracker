
"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import type { Purchase } from '@/lib/types';
import { PackageOpen } from 'lucide-react';

interface InventoryTableProps {
    purchases: Purchase[] | null;
    isLoading: boolean;
}

interface ProcessedPurchaseItem {
    name: string;
    totalQuantity: number;
    totalCost: number;
    unit: string; // Assuming unit is consistent for the same item
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
                        <div key={i} className="flex items-center space-x-4 p-4">
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

export function InventoryTable({ purchases, isLoading }: InventoryTableProps) {

    const processedItems = useMemo((): ProcessedPurchaseItem[] => {
        if (!purchases) return [];

        const groupedItems = purchases.reduce((acc, purchase) => {
            if (!acc[purchase.itemName]) {
                acc[purchase.itemName] = {
                    name: purchase.itemName,
                    totalQuantity: 0,
                    totalCost: 0,
                    unit: purchase.unit, // Take the first unit found
                };
            }
            acc[purchase.itemName].totalQuantity += purchase.quantity;
            acc[purchase.itemName].totalCost += purchase.cost;
            return acc;
        }, {} as Record<string, ProcessedPurchaseItem>);

        return Object.values(groupedItems).sort((a, b) => a.name.localeCompare(b.name));

    }, [purchases]);


    if (isLoading) {
        return <InventorySkeleton />;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Monthly Purchase Summary</CardTitle>
                <CardDescription>
                    This is an automatically generated summary of all "Food & Groceries" purchased this month.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {processedItems.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[60%]">Item</TableHead>
                                <TableHead className="text-right">Total Purchased & Spent</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {processedItems.map(item => (
                                <TableRow key={item.name}>
                                    <TableCell>
                                        <div className="font-medium">{item.name}</div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="font-semibold">
                                            {item.totalQuantity.toFixed(2)} {item.unit}
                                        </div>
                                         <div className="text-sm text-muted-foreground">
                                            Total Cost: ৳{item.totalCost.toFixed(2)}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="text-center py-16 text-muted-foreground flex flex-col items-center justify-center">
                        <PackageOpen className="h-10 w-10 mb-4" />
                        <h3 className="text-lg font-semibold">No Purchase Data</h3>
                        <p>Log a "Food & Groceries" expense from the dashboard to see a summary here.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
