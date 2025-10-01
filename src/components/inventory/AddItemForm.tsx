
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useFirebase } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle } from 'lucide-react';
import { sanitizeFirestoreData } from '@/lib/utils';

const itemSchema = z.object({
  name: z.string().min(1, "Item name is required."),
  requiredQuantity: z.coerce.number().min(0.1, "Required quantity must be greater than 0."),
  unit: z.string().min(1, "Unit is required (e.g., kg, L, pcs)."),
  category: z.string().min(1, "Category is required."),
});

interface AddItemFormProps {
  groupId: string;
  onItemAdded: () => void;
}

export function AddItemForm({ groupId, onItemAdded }: AddItemFormProps) {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof itemSchema>>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: "",
      requiredQuantity: "" as any,
      unit: "",
      category: "",
    },
  });

  async function onSubmit(values: z.infer<typeof itemSchema>) {
    if (!groupId) {
      toast({ variant: "destructive", title: "Error", description: "You must be in a group to add an item." });
      return;
    }

    setIsSubmitting(true);
    try {
      const itemData = sanitizeFirestoreData({
        ...values,
        groupId,
        createdAt: serverTimestamp(),
      });
      await addDoc(collection(firestore, `groups/${groupId}/inventory`), itemData);

      toast({
        title: "Item Added",
        description: `"${values.name}" has been added to your inventory requirements.`,
      });
      form.reset();
      onItemAdded(); // Trigger the refresh function passed from the parent
    } catch (error) {
      console.error("Error adding item:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not add item. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><PlusCircle /> Add Inventory Item</CardTitle>
        <CardDescription>Add a new item to your monthly requirement list.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Name</FormLabel>
                  <FormControl><Input placeholder="e.g., Rice" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
               <FormField control={form.control} name="requiredQuantity" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Required Qty</FormLabel>
                    <FormControl><Input type="number" placeholder="5" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField control={form.control} name="unit" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <FormControl><Input placeholder="kg, L, pcs" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl><Input placeholder="e.g., Grains, Vegetables" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Item
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
