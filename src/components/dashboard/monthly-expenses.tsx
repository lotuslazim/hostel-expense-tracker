
"use client";

import type { Expense, ExpenseCategory } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Receipt, User, Zap, Flame } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ScrollArea } from "../ui/scroll-area";
import type { Timestamp } from "firebase/firestore";

const categoryIcons: Record<ExpenseCategory, React.ReactNode> = {
  Food: <Receipt className="h-5 w-5" />,
  Electricity: <Zap className="h-5 w-5" />,
  Gas: <Flame className="h-5 w-5" />,
  Other: <Receipt className="h-5 w-5" />,
};


export function MonthlyExpenses({ expenses, currentDate }: { expenses: Expense[]; currentDate: Date }) {
  
  // Sort expenses by date, most recent first
  const sortedExpenses = expenses.sort((a, b) => {
    const dateA = (a.date as unknown as Timestamp).toDate();
    const dateB = (b.date as unknown as Timestamp).toDate();
    return dateB.getTime() - dateA.getTime();
  });


  return (
    <Card>
      <CardHeader>
        <CardTitle>Month Expense</CardTitle>
        <CardDescription>All group expenses for {format(currentDate, "MMMM yyyy")}.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Expense</TableHead>
                <TableHead>Paid By</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {sortedExpenses.length > 0 ? sortedExpenses.map((expense) => {
                    const expenseDate = (expense.date as unknown as Timestamp).toDate();
                    return (
                        <TableRow key={expense.id}>
                            <TableCell className="text-sm text-muted-foreground">{format(expenseDate, "dd MMM")}</TableCell>
                            <TableCell>
                            <div className="flex items-center gap-2">
                                <span className="p-1.5 bg-muted rounded-full text-muted-foreground">
                                    {categoryIcons[expense.category] || <Receipt className="h-5 w-5" />}
                                </span>
                                <span>{expense.description}</span>
                            </div>
                            </TableCell>
                            <TableCell>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <User className="h-4 w-4" />
                                {expense.userName || 'N/A'}
                            </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">৳{expense.amount.toFixed(2)}</TableCell>
                        </TableRow>
                    )
                }) : (
                <TableRow>
                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">No expenses logged for this month.</TableCell>
                </TableRow>
                )}
            </TableBody>
            </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
