
"use client";

import type { Expense } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, FileUp, Utensils, Zap, Flame } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

const expenseCategories = ["Food", "Electricity", "Gas"] as const;

const categoryIcons: Record<typeof expenseCategories[number], React.ReactNode> = {
  Food: <Utensils className="h-5 w-5" />,
  Electricity: <Zap className="h-5 w-5" />,
  Gas: <Flame className="h-5 w-5" />,
};

export function ExpenseLog({ expenses }: { expenses: Expense[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Expense Tracker</CardTitle>
          <CardDescription>Keep an eye on your spending.</CardDescription>
        </div>
         <Dialog open={open} onOpenChange={setOpen}>
           <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
              </Button>
           </DialogTrigger>
           <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Expense</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                   <Label htmlFor="description">Description</Label>
                   <Input id="description" placeholder="e.g., Weekly groceries" />
                </div>
                 <div className="space-y-2">
                   <Label htmlFor="amount">Amount</Label>
                   <Input id="amount" type="number" placeholder="e.g., 45.00" />
                </div>
                <div className="space-y-2">
                   <Label htmlFor="category">Category</Label>
                   <Select>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {expenseCategories.map(cat => (
                           <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                   <Label htmlFor="receipt">Receipt (optional)</Label>
                   <Button asChild variant="outline" className="w-full justify-start font-normal text-muted-foreground"><label htmlFor="receipt" className="flex items-center cursor-pointer w-full"><FileUp className="mr-2 h-4 w-4"/> Click to upload</label></Button>
                   <Input id="receipt" type="file" className="hidden"/>
                </div>
                <Button className="w-full" onClick={() => setOpen(false)}>Save Expense</Button>
              </div>
           </DialogContent>
         </Dialog>
      </CardHeader>
      <CardContent className="space-y-6">
        {expenseCategories.map((category) => {
          const categoryExpenses = expenses.filter(
            (expense) => expense.category === category
          );
          return (
            <div key={category}>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-muted-foreground">
                  {categoryIcons[category]}
                </div>
                <h3 className="font-semibold text-lg">{category}</h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">{expense.description}</TableCell>
                      <TableCell className="text-right">৳{expense.amount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                  {categoryExpenses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} className="h-24 text-center">
                        No expenses logged in this category.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
