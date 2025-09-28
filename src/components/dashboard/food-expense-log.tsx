
"use client";

import type { Expense } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2, User } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useFirebase, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { doc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export function FoodExpenseLog({ expenses, currentDate }: { expenses: Expense[]; currentDate: Date }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const { firestore } = useFirebase();
  const { user: currentUser } = useUser();
  const currentUserRef = useMemoFirebase(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [firestore, currentUser]);
  const { data: currentUserData } = useDoc(currentUserRef);
  const groupId = currentUserData?.groupId;

  const resetForm = () => {
    setName("");
    setCost("");
  };

  const handleSaveItem = async () => {
    if (!name || !cost || !groupId || !currentUser) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please fill out all required fields." });
      return;
    }
    setIsSaving(true);
    
    const expenseData = {
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email?.split('@')[0],
        groupId,
        description: name,
        amount: parseFloat(cost),
        category: 'Food',
        date: currentDate,
        createdAt: serverTimestamp(),
    };

    try {
      const expenseCol = collection(firestore, `groups/${groupId}/expenses`);
      await addDoc(expenseCol, expenseData);

      toast({ title: "Success", description: "Food expense logged successfully." });
      resetForm();
      setOpen(false);
    } catch (error) {
      console.error("Error saving food expense:", error);
      toast({ variant: "destructive", title: "Save Failed", description: "There was a problem saving your expense." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Food Purchase Log</CardTitle>
          <CardDescription>Track individual food items bought.</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Purchased Item</DialogTitle>
              <DialogDescription>Log a food item you purchased for the group.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Item Description</Label>
                <Input id="name" placeholder="e.g., Rice, Olive Oil, etc." value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Total Cost</Label>
                <Input id="cost" type="number" placeholder="e.g., 550.00" value={cost} onChange={e => setCost(e.target.value)} />
              </div>
              <Button className="w-full" onClick={handleSaveItem} disabled={isSaving || !name || !cost}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Item
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Paid By</TableHead>
              <TableHead className="text-right">Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length > 0 ? expenses.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.description}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{item.userName || 'N/A'}</TableCell>
                <TableCell className="text-right">৳{item.amount.toFixed(2)}</TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">No food items purchased today.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
