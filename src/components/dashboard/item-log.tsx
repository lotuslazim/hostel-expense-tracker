
"use client";

import type { PurchasedItem } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useFirebase, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { doc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export function ItemLog({ items, currentDate }: { items: PurchasedItem[]; currentDate: Date }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("");
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
    setQuantity("1");
    setUnit("");
    setCost("");
  };

  const handleSaveItem = async () => {
    if (!name || !quantity || !unit || !cost || !groupId || !currentUser) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please fill out all required fields." });
      return;
    }
    setIsSaving(true);

    const itemData = {
      userId: currentUser.uid,
      userName: currentUser.displayName || currentUser.email?.split('@')[0],
      groupId,
      name,
      quantity: parseFloat(quantity),
      unit,
      cost: parseFloat(cost),
      date: currentDate,
      createdAt: serverTimestamp(),
    };

    try {
      const itemsCol = collection(firestore, `groups/${groupId}/purchasedItems`);
      await addDoc(itemsCol, itemData);
      toast({ title: "Success", description: "Item logged successfully." });
      resetForm();
      setOpen(false);
    } catch (error) {
      console.error("Error saving item:", error);
      toast({ variant: "destructive", title: "Save Failed", description: "There was a problem saving your item." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Item Purchase Log</CardTitle>
          <CardDescription>Track individual items bought.</CardDescription>
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
              <DialogDescription>Log an item you purchased for the group.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name</Label>
                <Input id="name" placeholder="e.g., Rice, Olive Oil, etc." value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input id="quantity" type="number" placeholder="e.g., 5" value={quantity} onChange={e => setQuantity(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Input id="unit" placeholder="e.g., kg, L, pcs" value={unit} onChange={e => setUnit(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Total Cost</Label>
                <Input id="cost" type="number" placeholder="e.g., 550.00" value={cost} onChange={e => setCost(e.target.value)} />
              </div>
              <Button className="w-full" onClick={handleSaveItem} disabled={isSaving || !name || !quantity || !unit || !cost}>
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
              <TableHead>Quantity</TableHead>
              <TableHead className="text-right">Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length > 0 ? items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.quantity} {item.unit}</TableCell>
                <TableCell className="text-right">৳{item.cost.toFixed(2)}</TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">No items purchased today.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
