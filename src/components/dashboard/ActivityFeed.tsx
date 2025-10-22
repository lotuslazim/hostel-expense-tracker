
"use client";

import { useMemo, memo }from "react";
import { format } from 'date-fns/format';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShoppingCart, Receipt, List, Zap, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Expense, PurchasedItem, ExpenseCategory } from "@/lib/types";
import { MonthSwitcher } from "../report/month-switcher";
import { Skeleton } from "../ui/skeleton";
import dynamic from "next/dynamic";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { Timestamp } from "firebase/firestore";

const ExpenseDetailsDialog = dynamic(() => import("./ExpenseDetailsDialog").then(mod => mod.ExpenseDetailsDialog), { 
    ssr: false,
    loading: () => <Skeleton className="h-7 w-16" /> 
});

interface ActivityFeedProps {
  expenses: Expense[];
  isLoading: boolean;
  currentMonth: Date;
  onMonthChange: (direction: "next" | "prev") => void;
}

const categoryIcons: Record<ExpenseCategory, React.ReactNode> = {
    "Food & Groceries": <ShoppingCart className="h-3 w-3" />,
    "Electricity": <Zap className="h-3 w-3" />,
    "Gas": <Flame className="h-3 w-3" />,
    "Other": <List className="h-3 w-3" />,
};

const CategoryBadge = memo(({ category }: { category: ExpenseCategory }) => {
    return (
        <Badge variant="secondary" className="inline-flex items-center justify-center gap-1.5 py-1 px-2">
            {categoryIcons[category]}
            <span>{category}</span>
        </Badge>
    )
});
CategoryBadge.displayName = 'CategoryBadge';


export function ActivityFeed({ expenses, isLoading, currentMonth, onMonthChange }: ActivityFeedProps) {

  const sortedExpenses = useMemo(() => {
    if (!expenses) return [];
    // The query now handles sorting, but we can ensure it here as a fallback
    return expenses.sort((a, b) => {
        const dateA = a.date as Timestamp;
        const dateB = b.date as Timestamp;
        return dateB.toMillis() - dateA.toMillis();
    });
  }, [expenses]);


  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
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
                            <TableHead className="w-[60px] hidden sm:table-cell">Date</TableHead>
                            <TableHead>Member & Item</TableHead>
                            <TableHead className="hidden md:table-cell">Category</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedExpenses.map((item) => (
                            <TableRow key={`expense-${item.id}`} className="align-top">
                                <TableCell className="hidden sm:table-cell pt-3">{format((item.date as Timestamp).toDate(), "MMM d")}</TableCell>
                                <TableCell className="pt-3">
                                    <div className="font-medium">{item.userName}</div>
                                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                                      <span className="font-medium text-foreground/80">Item: </span>
                                      <span>{item.expenseItem}</span>
                                       <ExpenseDetailsDialog item={item} />
                                    </div>
                                    <div className="md:hidden pt-2">
                                        <CategoryBadge category={item.category} />
                                    </div>
                                </TableCell>
                                <TableCell className="hidden md:table-cell pt-3"><CategoryBadge category={item.category} /></TableCell>
                                <TableCell className="text-right font-semibold pt-3">৳{item.amount.toFixed(2)}</TableCell>
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

    