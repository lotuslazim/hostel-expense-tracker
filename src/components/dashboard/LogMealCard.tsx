"use client";

import { useState, useMemo, useEffect, lazy, Suspense } from "react";
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
import { useUser, useDoc, useCollection } from "@/firebase";
import { firestore } from "@/firebase/config";
import { doc, collection, serverTimestamp, Timestamp, addDoc, deleteDoc, query, where, orderBy } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Utensils, Trash2 } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { ToastAction } from "../ui/toast";
import { startOfDay, endOfDay } from "date-fns";
import type { MealLog } from "@/lib/types";

const AlertDialog = lazy(() => import('@/components/ui/alert-dialog').then(module => ({ default: module.AlertDialog })));
const AlertDialogAction = lazy(() => import('@/components/ui/alert-dialog').then(module => ({ default: module.AlertDialogAction })));
const AlertDialogCancel = lazy(() => import('@/components/ui/alert-dialog').then(module => ({ default: module.AlertDialogCancel })));
const AlertDialogContent = lazy(() => import('@/components/ui/alert-dialog').then(module => ({ default: module.AlertDialogContent })));
const AlertDialogDescription = lazy(() => import('@/components/ui/alert-dialog').then(module => ({ default: module.AlertDialogDescription })));
const AlertDialogFooter = lazy(() => import('@/components/ui/alert-dialog').then(module => ({ default: module.AlertDialogFooter })));
const AlertDialogHeader = lazy(() => import('@/components/ui/alert-dialog').then(module => ({ default: module.AlertDialogHeader })));
const AlertDialogTitle = lazy(() => import('@/components/ui/alert-dialog').then(module => ({ default: module.AlertDialogTitle })));
const AlertDialogTrigger = lazy(() => import('@/components/ui/alert-dialog').then(module => ({ default: module.AlertDialogTrigger })));

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

  // Query for meals logged today by the current user
  const todaysMealsQuery = useMemo(() => {
    if (!currentUser || !groupId) return null;
    const start = Timestamp.fromDate(startOfDay(selectedDate));
    const end = Timestamp.fromDate(endOfDay(selectedDate));
    return query(
      collection(firestore, `groups/${groupId}/meals`),
      where("userId", "==", currentUser.uid),
      where("date", ">=", start),
      where("date", "<=", end),
      orderBy("date", "desc")
    );
  }, [currentUser, groupId, selectedDate]);

  const { data: loggedMeals, isLoading: areMealsLoading } = useCollection<MealLog>(todaysMealsQuery);


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
  }, [isMealItemNameRequired, mealTypes, form]);

  const handleUndo = (docId: string) => {
    if (!groupId) return;
    const docRef = doc(firestore, `groups/${groupId}/meals`, docId);
    deleteDoc(docRef);
    toast({ title: "Action Undone", description: "The meal log has been removed." });
  };

  const handleDelete = async (docId: string) => {
    if (!groupId) return;
    const docRef = doc(firestore, `groups/${groupId}/meals`, docId);
    try {
      await deleteDoc(docRef);
      toast({ title: "Meal Log Removed" });
    } catch(e) {
      toast({ variant: "destructive", title: "Error", description: "Could not remove meal log." });
    }
  }

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
      userId: currentUser.uid,
      userName: currentUser.displayName || currentUser.email?.split('@')[0],
      createdAt: serverTimestamp(),
      itemName: values.itemName || null,
      groupId,
    };
    
    // Perform the database operation and get the new doc's ID
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

         <div className="mt-6 pt-6 border-t">
            <h4 className="font-medium text-center mb-4">Logged for this day</h4>
            {areMealsLoading ? (
                <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </div>
            ) : loggedMeals && loggedMeals.length > 0 ? (
                <div className="space-y-2">
                    {loggedMeals.map(meal => (
                        <div key={meal.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                           <div>
                            <p className="font-medium capitalize">
                                {meal.mealType} (x{meal.mealNumber})
                            </p>
                            {meal.itemName && <p className="text-xs text-muted-foreground">{meal.itemName}</p>}
                           </div>
                           <Suspense fallback={<Skeleton className="h-8 w-8" />}>
                           <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive h-8 w-8">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action will permanently delete this meal log.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(meal.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                           </AlertDialog>
                           </Suspense>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-muted-foreground text-center">No meals logged for this date yet.</p>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
