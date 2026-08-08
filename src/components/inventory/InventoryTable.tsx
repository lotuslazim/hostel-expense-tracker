
"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import type { Purchase } from '@/lib/types';
import { PackageOpen, ChevronDown, Loader2 } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns/format';
import { toDate } from 'date-fns/toDate';
import { Timestamp } from 'firebase/firestore';


interface InventoryTableProps {
    purchases: Purchase[] | null;
    isLoading: boolean;
    onLoadMore: () => void;
    hasMore: boolean;
    isMoreLoading: boolean;
}

interface ProcessedPurchaseItem {
    name: string;
    totalQuantity: number;
    totalCost: number;
    unit: string; // Assuming unit is consistent for the same item
    contributions: Purchase[];
    averagePrice: number;
}

function InventorySkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-7 w-1/2" />
                <Skeleton className="h-4 w-3/4 mt-2" />
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center p-4 border-b last:border-b-0">
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-6 w-1/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                            <Skeleton className="h-8 w-8 ml-2" />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export function InventoryTable({ purchases, isLoading, onLoadMore, hasMore, isMoreLoading }: InventoryTableProps) {

    const processedItems = useMemo((): ProcessedPurchaseItem[] => {
        if (!purchases) return [];

        const groupedItems = purchases.reduce((acc, purchase) => {
            const itemName = purchase.itemName.trim();
            if (!acc[itemName]) {
                acc[itemName] = {
                    name: itemName,
                    totalQuantity: 0,
                    totalCost: 0,
                    unit: purchase.unit,
                    contributions: [],
                    averagePrice: 0,
                };
            }
            acc[itemName].totalQuantity += purchase.quantity;
            acc[itemName].totalCost += purchase.cost;
            acc[itemName].contributions.push(purchase);
            return acc;
        }, {} as Record<string, ProcessedPurchaseItem>);

        return Object.values(groupedItems).map(item => ({
            ...item,
            averagePrice: item.totalQuantity > 0 ? item.totalCost / item.totalQuantity : 0,
        })).sort((a, b) => a.name.localeCompare(b.name));

    }, [purchases]);


    if (isLoading) {
        return <InventorySkeleton />;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Monthly Purchase Summary</CardTitle>
                <CardDescription>
                    This is an automatically generated summary of all "Food & Groceries" purchased this month. Click on an item to see the contribution breakdown.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {processedItems.length > 0 ? (
                    <>
                        <div className="border rounded-lg">
                            {processedItems.map(item => (
                                <Collapsible key={item.name} className="border-b last:border-b-0 group">
                                    <CollapsibleTrigger asChild>
                                        <div className="flex items-center p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                                            <div className="flex-1">
                                                <p className="font-medium text-lg">{item.name}</p>
                                                <div className="text-sm text-muted-foreground">
                                                    <span>{item.totalQuantity.toFixed(2)} {item.unit}</span>
                                                    <span className="mx-2">·</span>
                                                    <span>Total: ৳{item.totalCost.toFixed(2)}</span>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 ml-2">
                                                <ChevronDown className="h-5 w-5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                                <span className="sr-only">View Contributions</span>
                                            </Button>
                                        </div>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <div className="p-4 bg-muted/50 border-t">
                                            <div className="flex justify-between items-center mb-3">
                                                <h4 className="font-semibold">Contribution Breakdown</h4>
                                                <Badge variant="secondary">
                                                    Avg. Price: ৳{item.averagePrice.toFixed(2)} / {item.unit}
                                                </Badge>
                                            </div>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Member</TableHead>
                                                        <TableHead>Date</TableHead>
                                                        <TableHead className="text-right">Quantity</TableHead>
                                                        <TableHead className="text-right">Cost</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {item.contributions.sort((a, b) => (a.date instanceof Timestamp ? a.date.toMillis() : a.date.getTime()) - (b.date instanceof Timestamp ? b.date.toMillis() : b.date.getTime())).map(contrib => (
                                                        <TableRow key={contrib.id}>
                                                            <TableCell>{contrib.userName}</TableCell>
                                                            <TableCell>{format(contrib.date instanceof Timestamp ? contrib.date.toDate() : toDate(contrib.date), 'MMM dd')}</TableCell>
                                                            <TableCell className="text-right">{contrib.quantity.toFixed(2)} {contrib.unit}</TableCell>
                                                            <TableCell className="text-right">৳{contrib.cost.toFixed(2)}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>
                            ))}
                        </div>
                         {hasMore && (
                            <div className="pt-4 text-center">
                                <Button onClick={onLoadMore} disabled={isMoreLoading}>
                                    {isMoreLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Load More Purchases
                                </Button>
                            </div>
                        )}
                    </>
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

    
