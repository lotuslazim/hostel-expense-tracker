
"use client";

import { useCollection, type WithId } from "@/firebase";
import type { Expense } from "@/lib/types";
import { Query } from "firebase/firestore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, ShoppingCart } from "lucide-react";
import { format } from 'date-fns';
import { Badge } from "../ui/badge";

interface SharedExpensesProps {
  expensesQuery: Query | null;
}

export function SharedExpenses({ expensesQuery }: SharedExpensesProps) {
  const { data: expenses, isLoading, error } = useCollection<Expense>(expensesQuery);

  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-72 mt-2" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-64 w-full" />
            </CardContent>
        </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
            Could not load shared expenses. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }
  
  const getCategoryVariant = (category: Expense['category']) => {
    switch(category) {
        case 'Food & Groceries': return 'default';
        case 'Utilities': return 'secondary';
        case 'Other': return 'outline';
        default: return 'secondary';
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shared Expense Log</CardTitle>
        <CardDescription>A real-time log of all expenses within your group.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Paid By</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses && expenses.length > 0 ? (
              expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="hidden sm:table-cell">{format(expense.date.toDate(), 'dd MMM yyyy')}</TableCell>
                   <TableCell className="sm:hidden table-cell">{format(expense.date.toDate(), 'dd/MM/yy')}</TableCell>
                  <TableCell className="font-medium">{expense.description}</TableCell>
                  <TableCell>
                      <Badge variant={getCategoryVariant(expense.category)}>{expense.category}</Badge>
                  </TableCell>
                  <TableCell>{expense.userName}</TableCell>
                  <TableCell className="text-right font-semibold">৳{expense.amount.toFixed(2)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                   <div className="flex flex-col items-center gap-2">
                        <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No expenses logged yet.</p>
                    </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
