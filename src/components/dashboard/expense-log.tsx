
"use client";

import type { Expense, ExpenseCategory } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Zap, Flame, Receipt, User } from "lucide-react";

const categoryIcons: Record<ExpenseCategory, React.ReactNode> = {
  Food: <Receipt className="h-5 w-5" />, // Keep for type correctness, though it won't be used
  Electricity: <Zap className="h-5 w-5" />,
  Gas: <Flame className="h-5 w-5" />,
  Other: <Receipt className="h-5 w-5" />,
};

export function ExpenseLog({ expenses }: { expenses: Expense[] }) {

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Expense Log</CardTitle>
          <CardDescription>Daily electricity and gas bills for the group.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Expense</TableHead>
              <TableHead>Paid By</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length > 0 ? expenses.map((expense) => (
              <TableRow key={expense.id}>
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
            )) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">No utility expenses logged for today.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
