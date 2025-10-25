
"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from 'date-fns/format';
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
import { useUser, useDoc, useCollection } from "@/firebase";
import { firestore } from "@/firebase/config";
import { doc, collection, serverTimestamp, Timestamp, addDoc, deleteDoc, query, where } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Utensils, CheckCircle } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { ToastAction } from "../ui/toast";
import { Separator } from "../ui/separator";

interface LogMealCardProps {
    selectedDate: Date;
}

export function LogMealCard({ selectedDate }: LogMealCardProps) {
  const { user: currentUser } = useUser();
  const { toast } = useToast();

  const currentUserRef = useMemo(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [currentUser]);
  const { data: currentUserData } = useDoc(currentUserRef);
  const groupId = currentUserData?.groupId;

  const groupRef = useMemo(() => (groupId) ? doc(firestore, "groups", groupId) : null, [groupId]);
  const { data: groupData, isLoading: isGroupDataLoading } = useDoc(groupRef);

  const mealTypes = useMemo(() => groupData?.settings?.mealTypes ?? ["Lunch", "Dinner"], [groupData]);
  const isMealItemNameRequired = useMemo(() => groupData?.settings?.isMealItemNameRequired ?? false, [groupData]);

  // --- Meal Checker Logic ---
  const dayQueryRange = useMemo(() => {
    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(selectedDate);
    end.setHours(23, 59, 59, 999);
    
    return { start: Timestamp.fromDate(start), end: Timestamp.fromDate(end) };
  }, [selectedDate]);

  const mealsQuery = useMemo(() => {
    if (!currentUser || !groupId) return null;
    
    console.log("Query Parameters:", {
        userId: currentUser.uid,
        groupId,
        start: dayQueryRange.start.toDate(),
        end: dayQueryRange.end.toDate(),
    });

    const q = query(
      collection(firestore, `groups/${groupId}/meals`),
      where('userId', '==', currentUser.uid),
      where('date', '>=', dayQueryRange.start),
      where('date', '<=', dayQuery-range.end)
    );
    console.log("Constructed Query Object:", q);
    return q;

  }, [currentUser, groupId, dayQueryRange]);

  const { data: loggedMeals, isLoading: areMealsLoading } = useCollection(mealsQuery);
  
  useEffect(() => {
    if(!areMealsLoading) {
      console.log("Raw meal data from Firestore:", loggedMeals);
    }
  }, [loggedMeals, areMealsLoading]);

  const mealSummary = useMemo(() => {
    const summary = mealTypes.reduce((acc: any, type: string) => {
        acc[type.toLowerCase()] = 0;
        return acc;
    }, {});
    
    if (loggedMeals) {
        loggedMeals.forEach(meal => {
            const mealTypeLower = meal.mealType.toLowerCase();
            if (summary[mealTypeLower] !== undefined) {
                summary[mealTypeLower] += meal.mealNumber;
            }
        });
    }
    return summary;
  }, [loggedMeals, mealTypes]);
  // --- End Meal Checker Logic ---


  const mealSchema = useMemo(() => {
    const safeMealTypes = mealTypes.length > 0 ? mealTypes.map((t: string) => t.toLowerCase()) : ["dummy"];
    
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
      mealType: undefined,
    },
  });

  useEffect(() => {
    form.reset({
      mealCount: 1,
      itemName: "",
      mealType: undefined
    });
  }, [isMealItemNameRequired, mealTypes, form, selectedDate]);

  const handleUndo = (docId: string) => {
    if (!groupId) return;
    const docRef = doc(firestore, `groups/${groupId}/meals`, docId);
    deleteDoc(docRef);
    toast({ title: "Action Undone", description: "The meal log has been removed." });
  };

  async function onSubmit(values: MealSchemaType) {
    if (!currentUser || !groupId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be in a group to log a meal.",
      });
      return;
    }
    
    const mealData = {
      mealType: values.mealType,
      mealNumber: values.mealCount,
      description: `${values.mealCount} ${values.mealType}(s) logged. ${values.itemName ? `Item: ${values.itemName}` : ''}`,
      date: Timestamp.fromDate(selectedDate),
      createdAt: serverTimestamp(),
      userId: currentUser.uid,
      userName: currentUser.displayName || currentUser.email?.split('@')[0],
      itemName: values.itemName || null,
      groupId,
    };
    
    const mealCollectionRef = collection(firestore, `groups/${groupId}/meals`);
    try {
        const docRef = await addDoc(mealCollectionRef, mealData);
        
        toast({
            title: "Meal Logged!",
            description: `Your ${values.mealType} has been successfully logged.`,
            action: (
              <ToastAction altText="Undo" onClick={() => handleUndo(docRef.id)}>
                Undo
              </ToastAction>
            ),
        });

    } catch(e) {
         toast({
            variant: "destructive",
            title: "Error",
            description: "Could not log meal. Please try again.",
        });
        console.error("Meal logging error:", e);
    }
    
    form.reset({ mealCount: 1, mealType: undefined, itemName: "" });
  }
  
  if (isGroupDataLoading && groupId) {
      return (
          <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Utensils /> Log a Meal</CardTitle>
                  <CardDescription>Loading group settings...</CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-3">
                        <Skeleton className="h-4 w-1/4" />
                        <div className="flex flex-wrap gap-x-4 gap-y-2">
                          <Skeleton className="h-5 w-20" />
                          <Skeleton className="h-5 w-20" />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                     <div className="space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <Skeleton className="h-10 w-full" />
                  </div>
              </CardContent>
          </Card>
      );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Utensils /> Log a Meal</CardTitle>
        <CardDescription>
          Select the meal type and count for {format(selectedDate, "PPP")}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-6">
            <h4 className="text-sm font-medium text-muted-foreground">Logged Meals for this Day</h4>
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                {areMealsLoading ? <Skeleton className="h-12 w-full" /> : 
                mealTypes.map((type: string) => {
                    const typeLower = type.toLowerCase();
                    const loggedCount = mealSummary[typeLower];
                    const isLogged = loggedCount > 0;
                    return (
                        <div key={type} className="flex items-center justify-between text-sm">
                            <span className="font-medium capitalize">{type}</span>
                            {isLogged ? (
                                <div className="flex items-center gap-2 text-green-600 font-semibold">
                                    <CheckCircle className="h-4 w-4"/>
                                    <span>Logged ({loggedCount})</span>
                                </div>
                            ) : (
                                <span className="text-muted-foreground">Not logged</span>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
        <Separator className="mb-6"/>
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
                              <RadioGroupItem value={type.toLowerCase()} />
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
                    <Input placeholder="e.g., Chicken Curry" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={mealTypes.length === 0 || form.formState.isSubmitting} className="w-full">
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Log Meal
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
    