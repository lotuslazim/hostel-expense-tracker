
"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFirebase, useUser } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Loader2, Utensils, Zap, Package, Flame, Image as ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useState, useEffect } from "react";
import type { ExpenseCategory } from "@/lib/types";

const expenseSchema = z.object({
  description: z.string().min(1, "Description is required."),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0."),
  category: z.enum(["Food & Groceries", "Other"]),
  quantity: z.coerce.number().min(0).optional(),
});

interface ExpenseLogFormProps {
    selectedDate: Date;
}

export function ExpenseLogForm({ selectedDate }: ExpenseLogFormProps) {
  const { firestore } = useFirebase();
  const { user: currentUser } = useUser();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: "",
      amount: 0,
      category: "Food & Groceries",
      quantity: 1,
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: z.infer<typeof expenseSchema>) => {
    if (!currentUser?.uid) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to log an expense." });
      return;
    }

    try {
      const userDoc = await (await import("firebase/firestore")).getDoc(
        (await import("firebase/firestore")).doc(firestore, "users", currentUser.uid)
      );
      const groupId = userDoc.data()?.groupId;
      const userName = userDoc.data()?.displayName || currentUser.email?.split('@')[0];

      if (!groupId) {
        toast({ variant: "destructive", title: "Error", description: "You must be in a group to log an expense." });
        return;
      }
      
      await addDoc(collection(firestore, `groups/${groupId}/expenses`), {
        ...values,
        date: selectedDate,
        userId: currentUser.uid,
        userName,
        createdAt: serverTimestamp(),
      });

      toast({ title: "Success", description: `Expense logged successfully!` });
      form.reset({ description: "", amount: 0, category: "Food & Groceries", quantity: 1 });
    } catch (error) {
      console.error("Error logging expense:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not log expense. Please try again." });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log an Expense</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., Weekly groceries" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Amount (৳)</FormLabel>
                        <FormControl>
                        <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Quantity (Optional)</FormLabel>
                        <FormControl>
                        <Input type="number" step="1" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
             <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Food & Groceries"><Utensils className="mr-2"/>Food & Groceries</SelectItem>
                            <SelectItem value="Other"><Package className="mr-2"/>Other</SelectItem>
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Log Expense
            </Button>
        </form>
        </Form>
      </CardContent>
    </Card>
  );
}
