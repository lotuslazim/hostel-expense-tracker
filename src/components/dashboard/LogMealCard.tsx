
"use client";

import { useState, useMemo, useEffect } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { useFirebase, useUser, useDoc } from "@/firebase";
import { doc, addDoc, collection, serverTimestamp, Timestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Utensils } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

interface LogMealCardProps {
    selectedDate: Date;
}

export function LogMealCard({ selectedDate }: LogMealCardProps) {
  const { firestore } = useFirebase();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentUserRef = useMemo(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [firestore, currentUser]);
  const { data: currentUserData } = useDoc(currentUserRef);
  const groupId = currentUserData?.groupId;

  const groupRef = useMemo(() => (groupId) ? doc(firestore, "groups", groupId) : null, [firestore, groupId]);
  const { data: groupData, isLoading: isGroupDataLoading } = useDoc(groupRef);

  const mealTypes = useMemo(() => groupData?.settings?.mealTypes ?? ["Lunch", "Dinner"], [groupData]);
  const isMealItemNameRequired = useMemo(() => groupData?.settings?.isMealItemNameRequired ?? false, [groupData]);

  const mealSchema = useMemo(() => {
    const safeMealTypes = mealTypes.length > 0 ? mealTypes : ["dummy"];
    
    return z.object({
        mealType: z.enum(safeMealTypes as [string, ...string[]], {
            required_error: "You need to select a meal type.",
        }),
        mealCount: z.coerce.number().min(1, "Meal count must be at least 1.").max(5, "Meal count cannot exceed 5."),
        itemName: isMealItemNameRequired 
            ? z.string().min(1, "Item name is required.") 
            : z.string().optional(),
    });
  }, [mealTypes, isMealItemNameRequired]);

  type MealSchemaType = z.infer<typeof mealSchema>;

  const form = useForm<MealSchemaType>({
    resolver: zodResolver(mealSchema),
    defaultValues: {
      mealCount: 1,
      itemName: "",
    },
  });

  useEffect(() => {
    form.reset({ mealCount: 1, itemName: "" });
  }, [isMealItemNameRequired, mealTypes, form]);

  async function onSubmit(values: MealSchemaType) {
    if (!currentUser || !groupId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be in a group to log a meal.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(firestore, `groups/${groupId}/meals`), {
        mealType: values.mealType,
        mealNumber: values.mealCount,
        description: `${values.mealCount} ${values.mealType}(s) logged. ${values.itemName ? `Item: ${values.itemName}` : ''}`,
        date: Timestamp.fromDate(selectedDate),
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email?.split('@')[0],
        createdAt: serverTimestamp(),
        itemName: values.itemName || null,
      });

      toast({
        title: "Meal Logged",
        description: `Your ${values.mealType} ${values.itemName ? `(${values.itemName})` : ''} has been successfully logged.`,
      });
      form.reset({ mealCount: 1, mealType: undefined, itemName: "" });
    } catch (error) {
      console.error("Error logging meal:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not log meal. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  if (isGroupDataLoading && groupId) {
      return (
          <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Utensils /> Log a Meal</CardTitle>
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
        <CardTitle className="flex items-center gap-2"><Utensils /> Log a Meal</CardTitle>
        <CardDescription>
          Select the meal type and count.
        </CardDescription>
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
                      value={field.value}
                      className="flex flex-wrap gap-x-4 gap-y-2"
                    >
                      {mealTypes.length > 0 ? mealTypes.map((type: string) => (
                          <FormItem key={type} className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value={type} />
                            </FormControl>
                            <FormLabel className="font-normal capitalize">{type}</FormLabel>
                          </FormItem>
                        )) : <p className="text-sm text-muted-foreground">No meal types configured. Ask an admin to add one.</p>}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mealCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meal Count</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" max="5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="itemName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Name {isMealItemNameRequired ? '' : '(Optional)'}</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Chicken Curry" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting || mealTypes.length === 0} className="w-full">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Log Meal
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
