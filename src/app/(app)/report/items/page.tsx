
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MOCK_ITEMS } from "@/lib/data";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";
import type { Item } from "@/lib/types";

// This function aggregates items by name and sums their quantities.
// It assumes units are consistent for items with the same name.
function aggregateItems(items: Item[]) {
  const itemMap = new Map<string, { quantity: number; unit: string }>();

  items.forEach(item => {
    const existing = itemMap.get(item.name);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      itemMap.set(item.name, { quantity: item.quantity, unit: item.unit });
    }
  });

  return Array.from(itemMap.entries()).map(([name, { quantity, unit }]) => ({
    name,
    quantity,
    unit,
  })).sort((a, b) => a.name.localeCompare(b.name));
}


export default function MonthlyItemsPage() {
    const aggregatedItems = useMemo(() => aggregateItems(MOCK_ITEMS), []);

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
                <Link href="/report"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight font-headline">
                Monthly Item Summary
              </h1>
              <p className="text-muted-foreground">
                Total quantities of all items purchased this month.
              </p>
            </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5"/>
                    Purchased Item Totals
                </CardTitle>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Item Name</TableHead>
                            <TableHead className="text-right">Total Quantity</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {aggregatedItems.length > 0 ? aggregatedItems.map((item) => (
                            <TableRow key={item.name}>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell className="text-right">{item.quantity} {item.unit}</TableCell>
                            </TableRow>
                        )) : (
                             <TableRow>
                                <TableCell colSpan={2} className="text-center h-24">
                                    No items have been logged this month.
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
