
"use client";

import { useMemo } from "react";
import { format, isSameDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Expense } from "@/lib/types";

interface ActivityFeedProps {
  expenses: Expense[];
  selectedDate: Date;
}

export function ActivityFeed({ expenses, selectedDate }: ActivityFeedProps) {

  const dailyExpenses = useMemo(() => {
    if (!expenses) return [];
    return expenses
      .filter(expense => isSameDay((expense.date as any).toDate(), selectedDate))
      .sort((a, b) => (b.date as any).toDate() - (a.date as any).toDate());
  }, [expenses, selectedDate]);


  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle>Daily Expense Feed</CardTitle>
                <CardDescription>
                  Showing expenses for {format(selectedDate, "PPP")}.
                </CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(85vh-100px)]">
            {dailyExpenses.length > 0 ? (
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Member</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {dailyExpenses.map((item) => (
                            <TableRow key={`expense-${item.id}`}>
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
                    <p>No expenses logged for this day.</p>
                </div>
            )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
