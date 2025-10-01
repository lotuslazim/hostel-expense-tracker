
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useFirebase, useUser } from '@/firebase';
import { addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { FoodItem } from '@/lib/types';
import { sanitizeFirestoreData } from '@/lib/utils';

const purchaseSchema = z.object({
  quantity: z.coerce.number().min(0.01, "Quantity must be greater than 0."),
  cost: z.coerce.number().min(0.01, "Cost must be greater than 0."),
});

interface LogPurchaseDialogProps {
  item: FoodItem;
  groupId: string;
}

export function LogPurchaseDialog({ item, groupId }: LogPurchaseDialogProps) {
  const { firestore } = useFirebase();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<z.infer<typeof purchaseSchema>>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      quantity: 1,
      cost: 0,
    },
  });

  async function onSubmit(values: z.infer<typeof purchaseSchema>) {
    if (!currentUser || !groupId) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in and in a group." });
      return;
    }

    setIsSubmitting(true);
    try {
      const unitPrice = values.cost / values.quantity;
      
      const purchaseData = sanitizeFirestoreData({
        itemId: item.id,
        itemName: item.name,
        quantity: values.quantity,
        cost: values.cost,
        unitPrice: unitPrice,
        date: Timestamp.now(),
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Unknown',
        groupId,
      });

      await addDoc(collection(firestore, `groups/${groupId}/purchases`), purchaseData);

      toast({
        title: "Purchase Logged",
        description: `Purchase for ${item.name} has been successfully logged.`,
      });
      form.reset();
      setIsOpen(false);
    } catch (error) {
      console.error("Error logging purchase:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not log purchase. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Log Purchase</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Log Purchase for {item.name}</DialogTitle>
          <DialogDescription>
            Enter the quantity and total cost for this purchase.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField control={form.control} name="quantity" render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity ({item.unit})</FormLabel>
                  <FormControl><Input type="number" placeholder="e.g., 5" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="cost" render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Cost (৳)</FormLabel>
                  <FormControl><Input type="number" placeholder="e.g., 550" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
                <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Purchase
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
