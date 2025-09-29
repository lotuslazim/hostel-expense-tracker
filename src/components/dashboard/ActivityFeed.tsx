
"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Expense } from "@/lib/types";

interface ActivityFeedProps {
  expenses: Expense[];
}

export function ActivityFeed({ expenses }: ActivityFeedProps) {

  const sortedExpenses = useMemo(() => {
    if (!expenses) return [];
    return [...expenses].sort((a, b) => (b.date as any).toDate() - (a.date as any).toDate());
  }, [expenses]);


  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle>Monthly Expense Feed</CardTitle>
                <CardDescription>Recent group expenses.</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(85vh-100px)]">
            {sortedExpenses.length > 0 ? (
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Member</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedExpenses.map((item) => (
                            <TableRow key={`expense-${item.id}`}>
                                <TableCell className="whitespace-nowrap">{format((item.date as any).toDate(), "MMM d, yy")}</TableCell>
                                <TableCell>{item.userName}</TableCell>
                                <TableCell>{item.description || "N/A"}</TableCell>
                                <TableCell><Badge variant="secondary">{item.category}</Badge></TableCell>
                                <TableCell className="text-right font-semibold">৳{item.amount.toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <div className="text-center py-16 text-muted-foreground flex flex-col items-center justify-center h-[calc(85vh-100px)]">
                    <ShoppingCart className="h-10 w-10 mb-2" />
                    <p>No expenses logged this month.</p>
                </div>
            )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
