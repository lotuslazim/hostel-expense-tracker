
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
import { useFirebase, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { doc, collection, addDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

const expenseCategories = ["Food", "Electricity", "Gas"] as const;
type ExpenseCategory = typeof expenseCategories[number];

const categoryDisplayNames: Record<ExpenseCategory, string> = {
  Food: "Bazar",
  Electricity: "Electricity",
  Gas: "Gas",
};

const categoryIcons: Record<ExpenseCategory, React.ReactNode> = {
  Food: <Utensils className="h-5 w-5" />,
  Electricity: <Zap className="h-5 w-5" />,
  Gas: <Flame className="h-5 w-5" />,
};

export function ExpenseLog({ expenses, currentDate }: { expenses: Expense[]; currentDate: Date }) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory | undefined>();
  const { toast } = useToast();

  const { firestore } = useFirebase();
  const { user: currentUser } = useUser();
  const currentUserRef = useMemoFirebase(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [firestore, currentUser]);
  const { data: currentUserData } = useDoc(currentUserRef);
  const groupId = currentUserData?.groupId;

  const resetForm = () => {
    setDescription("");
    setQuantity(1);
    setUnit("");
    setAmount("");
    setCategory(undefined);
    setOpen(false);
  };
  
  const handleSaveExpense = async () => {
    if (!description || !amount || !category || !groupId || !currentUser) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please fill out all required fields."});
      return;
    };

    const expenseData: Omit<Expense, 'id'> = {
      userId: currentUser.uid,
      groupId,
      description,
      quantity: category === 'Food' ? quantity : 1,
      unit: category === 'Food' ? unit : "",
      amount: parseFloat(amount),
      category,
      date: currentDate,
    };
    
    try {
        const expensesCol = collection(firestore, `groups/${groupId}/expenses`);
        await addDoc(expensesCol, expenseData);
        toast({ title: "Success", description: "Expense logged successfully." });
        resetForm();
    } catch (error) {
        console.error("Error saving expense:", error);
        toast({ variant: "destructive", title: "Save Failed", description: "There was a problem saving your expense." });
    }
  };

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
                   <Input id="description" placeholder="e.g., Weekly groceries, Electricity Bill" value={description} onChange={e => setDescription(e.target.value)} />
                </div>
                 <div className="space-y-2">
                   <Label htmlFor="amount">Amount</Label>
                   <Input id="amount" type="number" placeholder="e.g., 45.00" value={amount} onChange={e => setAmount(e.target.value)} />
                </div>
                <div className="space-y-2">
                   <Label htmlFor="category">Category</Label>
                   <Select value={category} onValueChange={(value: ExpenseCategory) => setCategory(value)}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {expenseCategories.map(cat => (
                           <SelectItem key={cat} value={cat}>{categoryDisplayNames[cat]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                </div>

                {category === 'Food' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <Label htmlFor="quantity">Quantity</Label>
                       <Input id="quantity" type="number" placeholder="e.g., 1" value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 1)} />
                    </div>
                    <div className="space-y-2">
                       <Label htmlFor="unit">Unit</Label>
                       <Input id="unit" placeholder="e.g., kg, litre, pcs" value={unit} onChange={e => setUnit(e.target.value)} />
                    </div>
                  </div>
                )}
                 <div className="space-y-2">
                   <Label htmlFor="receipt">Receipt (optional)</Label>
                   <Button asChild variant="outline" className="w-full justify-start font-normal text-muted-foreground"><label htmlFor="receipt" className="flex items-center cursor-pointer w-full"><FileUp className="mr-2 h-4 w-4"/> Click to upload</label></Button>
                   <Input id="receipt" type="file" className="hidden"/>
                </div>
                <Button className="w-full" onClick={handleSaveExpense} disabled={!description || !amount || !category}>Save Expense</Button>
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
                <h3 className="font-semibold text-lg">{categoryDisplayNames[category]}</h3>
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
                      <TableCell className="font-medium">
                        {expense.description}
                        {expense.quantity > 1 && <span className="text-muted-foreground ml-2">x{expense.quantity}</span>}
                        {expense.unit && <span className="text-muted-foreground ml-1">{expense.unit}</span>}
                      </TableCell>
                      <TableCell className="text-right">৳{expense.amount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                  {categoryExpenses.length === 0 && (
                    <TableRow>
                      <TableCell className="font-medium text-muted-foreground">null</TableCell>
                      <TableCell className="text-right text-muted-foreground">৳0.00</TableCell>
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

    