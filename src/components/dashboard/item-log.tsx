"use client";

import type { Item } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export function ItemLog({ items, onSetItems }: { items: Item[]; onSetItems: (items: Item[]) => void; }) {
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [cost, setCost] = useState('');

  const handleSaveItem = () => {
    const newItem: Item = {
      id: new Date().toISOString(),
      name: itemName,
      quantity: Number(quantity),
      unit: unit,
      cost: Number(cost),
      date: new Date(),
    };
    onSetItems([...items, newItem]);
    setItemName('');
    setQuantity('');
    setUnit('');
    setCost('');
    setOpen(false);
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Purchased Items</CardTitle>
          <CardDescription>Log items you've bought, like groceries.</CardDescription>
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
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                   <Label htmlFor="name">Item Name</Label>
                   <Input id="name" placeholder="e.g., Organic Bananas" value={itemName} onChange={(e) => setItemName(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input id="quantity" type="number" placeholder="e.g., 1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Input id="unit" placeholder="e.g., bunch" value={unit} onChange={(e) => setUnit(e.target.value)} />
                  </div>
                </div>
                 <div className="space-y-2">
                   <Label htmlFor="cost">Total Cost</Label>
                   <Input id="cost" type="number" placeholder="e.g., 1.29" value={cost} onChange={(e) => setCost(e.target.value)} />
                </div>
                <Button className="w-full" onClick={handleSaveItem}>Save Item</Button>
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
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.quantity} {item.unit}</TableCell>
                <TableCell className="text-right">৳{item.cost.toFixed(2)}</TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  No items logged for this day.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
