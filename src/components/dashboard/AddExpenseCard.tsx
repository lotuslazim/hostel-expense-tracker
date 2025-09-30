
"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFirebase, useUser, useDoc } from "@/firebase";
import { doc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShoppingCart } from "lucide-react";
import { sanitizeFirestoreData } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";


interface AddExpenseCardProps {
  selectedDate: Date;
}

export function AddExpenseCard({ selectedDate }: AddExpenseCardProps) {
  const { firestore } = useFirebase();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentUserRef = useMemo(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [firestore, currentUser]);
  const { data: currentUserData } = useDoc(currentUserRef);
  const groupId = currentUserData?.groupId;

  const groupRef = useMemo(() => (groupId ? doc(firestore, "groups", groupId) : null), [firestore, groupId]);
  const { data: groupData, isLoading: isGroupDataLoading } = useDoc(groupRef);

  const isExpenseDescriptionRequired = useMemo(() => groupData?.settings?.isExpenseDescriptionRequired ?? false, [groupData]);

  const expenseSchema = useMemo(() => {
    return z.object({
        amount: z.coerce.number().min(0.01, "Amount must be greater than 0."),
        description: isExpenseDescriptionRequired
            ? z.string().min(1, "Description is required.")
            : z.string().optional(),
        category: z.enum(["Food & Groceries", "Electricity", "Gas", "Other"], {
            required_error: "Please select a category.",
        }),
    });
  }, [isExpenseDescriptionRequired]);

  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: 0,
      description: "",
    },
  });
  
  async function onSubmit(values: z.infer<typeof expenseSchema>) {
    if (!currentUser || !groupId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be in a group to add an expense.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const expenseData = sanitizeFirestoreData({
        amount: values.amount,
        description: values.description || "",
        category: values.category,
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email?.split('@')[0],
        date: selectedDate,
        createdAt: serverTimestamp(),
      });

      await addDoc(collection(firestore, `groups/${groupId}/expenses`), expenseData);

      toast({
        title: "Expense Added",
        description: `Your ${values.category.toLowerCase()} expense of ৳${values.amount} has been logged.`,
      });
      form.reset({ amount: 0, description: "" });
    } catch (error) {
      console.error("Error adding expense:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not log expense. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  if (isGroupDataLoading && groupId) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShoppingCart /> Add an Expense</CardTitle>
                <CardDescription>Loading group settings...</CardDescription>
            </CardHeader>
            <CardContent>
                <Skeleton className="h-48 w-full" />
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShoppingCart /> Add an Expense</CardTitle>
          <CardDescription>
            Log a personal expense for your group.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select an expense category" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="Food & Groceries">Food & Groceries</SelectItem>
                        <SelectItem value="Electricity">Electricity</SelectItem>
                        <SelectItem value="Gas">Gas</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Amount (৳)</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Description {isExpenseDescriptionRequired ? '' : '(Optional)'}</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., Weekly groceries" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Expense
                </Button>
            </form>
            </Form>
        </CardContent>
    </Card>
  );
}
