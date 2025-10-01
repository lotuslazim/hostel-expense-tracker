
"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useFirebase, useUser, useDoc } from "@/firebase";
import {
  doc,
  addDoc,
  collection,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PackagePlus } from "lucide-react";
import { sanitizeFirestoreData } from "@/lib/utils";

const itemSchema = z.object({
  name: z.string().min(1, "Item name is required."),
  quantity: z.coerce.number().min(0.01, "Quantity must be greater than 0."),
  unit: z.string().min(1, "Unit is required (e.g., kg, L, pcs)."),
  cost: z.coerce.number().min(0, "Cost cannot be negative."),
});

export function AddPurchasedItemCard() {
  const { firestore } = useFirebase();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentUserRef = useMemo(
    () => (currentUser ? doc(firestore, "users", currentUser.uid) : null),
    [firestore, currentUser]
  );
  const { data: currentUserData } = useDoc(currentUserRef);
  const groupId = currentUserData?.groupId;

  const form = useForm<z.infer<typeof itemSchema>>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: "",
      quantity: 1,
      unit: "pcs",
      cost: 0,
    },
  });

  async function onSubmit(values: z.infer<typeof itemSchema>) {
    if (!currentUser || !groupId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be in a group to add an item.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const itemData = sanitizeFirestoreData({
        ...values,
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email?.split("@")[0],
        groupId: groupId,
        date: Timestamp.now(),
        createdAt: serverTimestamp(),
      });

      await addDoc(collection(firestore, `groups/${groupId}/purchasedItems`), itemData);

      toast({
        title: "Item Added",
        description: `${values.quantity} ${values.unit} of ${values.name} has been logged.`,
      });
      form.reset();
    } catch (error) {
      console.error("Error adding purchased item:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not log item. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PackagePlus /> Add Purchased Item
        </CardTitle>
        <CardDescription>
          Log a specific food item or grocery purchase.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Rice" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <FormControl>
                      <Input placeholder="kg, L, pcs" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Cost (৳)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Log Item
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
