
"use client";

import { useMemo }from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Expense } from "@/lib/types";
import { MonthSwitcher } from "../report/month-switcher";
import { Skeleton } from "../ui/skeleton";

interface ActivityFeedProps {
  expenses: Expense[];
  isLoading: boolean;
  currentMonth: Date;
  onMonthChange: (direction: "next" | "prev") => void;
}

export function ActivityFeed({ expenses, isLoading, currentMonth, onMonthChange }: ActivityFeedProps) {

  const sortedExpenses = useMemo(() => {
    if (!expenses) return [];
    // The query now handles sorting, but we can ensure it here as a fallback
    return expenses.sort((a, b) => (b.date as any).toDate() - (a.date as any).toDate());
  }, [expenses]);


  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                <CardTitle>Monthly Expense Feed</CardTitle>
                <CardDescription>
                  Showing all expenses for {format(currentMonth, "MMMM yyyy")}.
                </CardDescription>
            </div>
             <MonthSwitcher 
                currentDate={currentMonth}
                onMonthChange={onMonthChange}
            />
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(85vh-150px)]">
            {isLoading ? (
                 <div className="space-y-4">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-4 p-2">
                           <Skeleton className="h-10 w-full" />
                        </div>
                    ))}
                </div>
            ) : sortedExpenses.length > 0 ? (
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Member</TableHead>
                            <TableHead>Expense Item</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedExpenses.map((item) => (
                            <TableRow key={`expense-${item.id}`}>
                                <TableCell>{format((item.date as any).toDate(), "MMM d")}</TableCell>
                                <TableCell>{item.userName}</TableCell>
                                <TableCell>{item.expenseItem || item.description || "N/A"}</TableCell>
                                <TableCell><Badge variant="secondary">{item.category}</Badge></TableCell>
                                <TableCell className="text-right font-semibold">৳{item.amount.toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <div className="text-center py-16 text-muted-foreground flex flex-col items-center justify-center h-full">
                    <ShoppingCart className="h-10 w-10 mb-2" />
                    <p>No expenses logged for this month.</p>
                </div>
            )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
