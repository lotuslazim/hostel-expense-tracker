
"use client";

import { useMemo }from "react";
import { format } from 'date-fns/format';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShoppingCart, Receipt, List, Zap, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Expense, PurchasedItem, ExpenseCategory } from "@/lib/types";
import { MonthSwitcher } from "../report/month-switcher";
import { Skeleton } from "../ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

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

const CategoryBadge = ({ category }: { category: ExpenseCategory }) => {
    return (
        <Badge variant="secondary" className="flex items-center gap-1.5">
            {categoryIcons[category]}
            <span>{category}</span>
        </Badge>
    )
}

const ExpenseDetailsDialog = ({ item }: { item: Expense }) => {
    const isFood = item.category === 'Food & Groceries';
    const hasPurchasedItems = isFood && item.purchasedItems && item.purchasedItems.length > 0;

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 mt-2">Details</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Expense Details</DialogTitle>
                    <CardDescription>
                        Logged by {item.userName} on {format((item.date as any).toDate(), "MMM d, yyyy")}
                    </CardDescription>
                </DialogHeader>
                <div className="py-4">
                    {hasPurchasedItems ? (
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Item</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead className="text-right">Cost</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                               {item.purchasedItems?.map((purchasedItem, index) => (
                                   <TableRow key={index}>
                                       <TableCell>{purchasedItem.name}</TableCell>
                                       <TableCell>{purchasedItem.quantity} {purchasedItem.unit}</TableCell>
                                       <TableCell className="text-right">৳{purchasedItem.cost.toFixed(2)}</TableCell>
                                   </TableRow>
                               ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Item</span>
                                <span className="font-medium">{item.expenseItem}</span>
                            </div>
                             <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Category</span>
                                <CategoryBadge category={item.category} />
                            </div>
                             <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Amount</span>
                                <span className="font-bold text-lg">৳{item.amount.toFixed(2)}</span>
                            </div>
                            {item.receiptPhotoUrl && (
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Receipt</span>
                                    <a href={item.receiptPhotoUrl} target="_blank" rel="noopener noreferrer">
                                        <Button variant="link">View Receipt</Button>
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

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
                            <TableRow key={`expense-${item.id}`}>
                                <TableCell className="hidden sm:table-cell">{format((item.date as any).toDate(), "MMM d")}</TableCell>
                                <TableCell>
                                    <div className="font-medium">{item.userName}</div>
                                    <div className="text-sm text-muted-foreground">
                                      <span className="font-medium text-foreground/80">Item: </span>
                                      {item.expenseItem}
                                    </div>
                                    <div className="md:hidden pt-1">
                                        <CategoryBadge category={item.category} />
                                    </div>
                                    <ExpenseDetailsDialog item={item} />
                                </TableCell>
                                <TableCell className="hidden md:table-cell"><CategoryBadge category={item.category} /></TableCell>
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
