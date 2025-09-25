import type { Expense } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, FileUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ExpenseLog({ expenses }: { expenses: Expense[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Expense Tracker</CardTitle>
          <CardDescription>Keep an eye on your spending.</CardDescription>
        </div>
         <Dialog>
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
                   <Input id="description" placeholder="e.g., Dinner with friends" />
                </div>
                 <div className="space-y-2">
                   <Label htmlFor="amount">Amount</Label>
                   <Input id="amount" type="number" placeholder="e.g., 45.00" />
                </div>
                <div className="space-y-2">
                   <Label htmlFor="category">Category</Label>
                   <Input id="category" placeholder="e.g., Dining Out" />
                </div>
                 <div className="space-y-2">
                   <Label htmlFor="receipt">Receipt (optional)</Label>
                   <Button asChild variant="outline" className="w-full justify-start font-normal text-muted-foreground"><label htmlFor="receipt" className="flex items-center cursor-pointer w-full"><FileUp className="mr-2 h-4 w-4"/> Click to upload</label></Button>
                   <Input id="receipt" type="file" className="hidden"/>
                </div>
                <Button className="w-full">Save Expense</Button>
              </div>
           </DialogContent>
         </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="font-medium">{expense.description}</TableCell>
                <TableCell>{expense.category}</TableCell>
                <TableCell className="text-right">${expense.amount.toFixed(2)}</TableCell>
              </TableRow>
            ))}
             {expenses.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  No expenses logged for this day.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
