
"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useFirebase, useUser } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

const mealSchema = z.object({
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"], {
    required_error: "You need to select a meal type.",
  }),
  description: z.string().optional(),
  mealNumber: z.coerce.number().min(0).optional().default(1),
});

interface MealLogFormProps {
    selectedDate: Date;
}

export function MealLogForm({ selectedDate }: MealLogFormProps) {
  const { firestore } = useFirebase();
  const { user: currentUser } = useUser();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof mealSchema>>({
    resolver: zodResolver(mealSchema),
    defaultValues: {
        mealType: 'lunch',
        description: '',
        mealNumber: 1,
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: z.infer<typeof mealSchema>) => {
    if (!currentUser?.uid) {
        toast({ variant: "destructive", title: "Error", description: "You must be logged in to log a meal." });
        return;
    }

    try {
        const userDoc = await (await import("firebase/firestore")).getDoc(
            (await import("firebase/firestore")).doc(firestore, "users", currentUser.uid)
        );
        const groupId = userDoc.data()?.groupId;
        const userName = userDoc.data()?.displayName || currentUser.email?.split('@')[0];

        if (!groupId) {
            toast({ variant: "destructive", title: "Error", description: "You must be in a group to log a meal." });
            return;
        }

        await addDoc(collection(firestore, `groups/${groupId}/meals`), {
            ...values,
            date: selectedDate,
            userId: currentUser.uid,
            userName,
            createdAt: serverTimestamp(),
        });
        
        toast({ title: "Success", description: "Meal logged successfully!" });
        form.reset({ mealType: "lunch", description: "", mealNumber: 1 });

    } catch (error) {
        console.error("Error logging meal:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not log meal. Please try again." });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log a Meal</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
            control={form.control}
            name="mealType"
            render={({ field }) => (
                <FormItem className="space-y-3">
                <FormLabel>Meal Type</FormLabel>
                <FormControl>
                    <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-wrap gap-x-6 gap-y-2"
                    >
                    <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                        <RadioGroupItem value="breakfast" />
                        </FormControl>
                        <FormLabel className="font-normal">Breakfast</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                        <RadioGroupItem value="lunch" />
                        </FormControl>
                        <FormLabel className="font-normal">Lunch</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                        <RadioGroupItem value="dinner" />
                        </FormControl>
                        <FormLabel className="font-normal">Dinner</FormLabel>
                    </FormItem>
                     <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                        <RadioGroupItem value="snack" />
                        </FormControl>
                        <FormLabel className="font-normal">Snack</FormLabel>
                    </FormItem>
                    </RadioGroup>
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
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., Rice and curry" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="mealNumber"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Meal Count</FormLabel>
                    <FormControl>
                        <Input type="number" min="0" step="0.5" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Log Meal
            </Button>
        </form>
        </Form>
      </CardContent>
    </Card>
  );
}
