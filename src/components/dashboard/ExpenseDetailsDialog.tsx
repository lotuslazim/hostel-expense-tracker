
"use client";

import { memo } from "react";
import { format } from 'date-fns/format';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Expense, ExpenseCategory } from "@/lib/types";
import { ShoppingCart, Zap, Flame, List } from "lucide-react";

interface ExpenseDetailsDialogProps {
  item: Expense;
}

const categoryIcons: Record<ExpenseCategory, React.ReactNode> = {
    "Food & Groceries": <ShoppingCart className="h-3 w-3" />,
    "Electricity": <Zap className="h-3 w-3" />,
    "Gas": <Flame className="h-3 w-3" />,
    "Other": <List className="h-3 w-3" />,
};

const CategoryBadge = memo(({ category }: { category: ExpenseCategory }) => {
    return (
        <Badge variant="outline" className="inline-flex items-center gap-1.5 py-1 px-2">
            {categoryIcons[category]}
            <span>{category}</span>
        </Badge>
    )
});
CategoryBadge.displayName = 'CategoryBadge';

export const ExpenseDetailsDialog = memo(({ item }: ExpenseDetailsDialogProps) => {
    const isFood = item.category === 'Food & Groceries';
    const hasPurchasedItems = isFood && item.purchasedItems && item.purchasedItems.length > 0;

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 px-2 text-xs">Details</Button>
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
});
ExpenseDetailsDialog.displayName = 'ExpenseDetailsDialog';
