
"use client";

import type { Expense, ExpenseCategory } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, ShoppingBasket, Zap, Flame, Receipt } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useFirebase, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { doc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const categoryIcons: Record<ExpenseCategory, React.ReactNode> = {
  Food: <ShoppingBasket className="h-5 w-5" />,
  Electricity: <Zap className="h-5 w-5" />,
  Gas: <Flame className="h-5 w-5" />,
  Other: <Receipt className="h-5 w-5" />,
};

export function ExpenseLog({ expenses, currentDate }: { expenses: Expense[]; currentDate: Date }) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("Other");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const { firestore } = useFirebase();
  const { user: currentUser } = useUser();
  const currentUserRef = useMemoFirebase(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [firestore, currentUser]);
  const { data: currentUserData } = useDoc(currentUserRef);
  const groupId = currentUserData?.groupId;

  const resetForm = () => {
    setDescription("");
    setAmount("");
    setCategory("Other");
  };
  
  const handleSaveExpense = async () => {
    if (!description || !amount || !category || !groupId || !currentUser) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please fill out all required fields."});
      return;
    };
    setIsSaving(true);

    const expenseData = {
      userId: currentUser.uid,
      userName: currentUser.displayName || currentUser.email?.split('@')[0],
      groupId,
      description,
      amount: parseFloat(amount),
      category,
      date: currentDate,
      createdAt: serverTimestamp(),
    };
    
    try {
        const expensesCol = collection(firestore, `groups/${groupId}/expenses`);
        await addDoc(expensesCol, expenseData);
        toast({ title: "Success", description: "Expense logged successfully." });
        resetForm();
        setOpen(false);
    } catch (error) {
        console.error("Error saving expense:", error);
        toast({ variant: "destructive", title: "Save Failed", description: "There was a problem saving your expense." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Expense Log</CardTitle>
          <CardDescription>Record group expenses.</CardDescription>
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
                <DialogDescription>Log a shared expense for the group.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                   <Label htmlFor="category">Category</Label>
                   <Select onValueChange={(value: ExpenseCategory) => setCategory(value)} defaultValue={category}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Food">Food</SelectItem>
                            <SelectItem value="Electricity">Electricity</SelectItem>
                            <SelectItem value="Gas">Gas</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                   </Select>
                </div>
                <div className="space-y-2">
                   <Label htmlFor="description">Description</Label>
                   <Input id="description" placeholder="e.g., Monthly groceries, utility bill" value={description} onChange={e => setDescription(e.target.value)} />
                </div>
                 <div className="space-y-2">
                   <Label htmlFor="amount">Total Amount</Label>
                   <Input id="amount" type="number" placeholder="e.g., 1200.00" value={amount} onChange={e => setAmount(e.target.value)} />
                </div>
                <Button className="w-full" onClick={handleSaveExpense} disabled={isSaving || !description || !amount}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Expense
                </Button>
              </div>
           </DialogContent>
         </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Expense</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length > 0 ? expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="font-medium">
                  {expense.description}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-muted rounded-full text-muted-foreground">
                        {categoryIcons[expense.category] || <Receipt className="h-5 w-5" />}
                    </span>
                    <span>{expense.category}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">৳{expense.amount.toFixed(2)}</TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">No expenses logged for today.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
