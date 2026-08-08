
"use client";

import { useMemo, useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useUser, useDoc, useCollection } from "@/firebase";
import { firestore } from "@/firebase/config";
import { doc, collection, serverTimestamp, Timestamp, query, where, orderBy, writeBatch, runTransaction } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Utensils, CheckCircle } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { ToastAction } from "../ui/toast";
import { Badge } from "../ui/badge";
import type { MealLog } from "@/lib/types";
import { cn } from "@/lib/utils";

interface LogMealCardProps {
    selectedDate: Date;
}

const UNDO_WINDOW_MS = 10_000;

const normalizeMealType = (mealType: string) =>
  mealType.trim().toLowerCase();

const isSafeMealType = (mealType: string) => {
  const normalizedMealType = normalizeMealType(mealType);

  return normalizedMealType.length > 0
    && normalizedMealType.length <= 40
    && !normalizedMealType.includes("/")
    && !normalizedMealType.includes("__");
};

const getMealDocumentId = (
  userId: string,
  selectedDate: Date,
  mealType: string
) => `${userId}__${format(selectedDate, "yyyy-MM-dd")}__${normalizeMealType(mealType)}`;

export function LogMealCard({ selectedDate }: LogMealCardProps) {
  const { user: currentUser } = useUser();
  const { toast } = useToast();

  const currentUserRef = useMemo(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [currentUser]);
  const { data: currentUserData } = useDoc(currentUserRef);
  const groupId = currentUserData?.groupId;

  const groupRef = useMemo(() => (groupId) ? doc(firestore, "groups", groupId) : null, [groupId]);
  const { data: groupData, isLoading: isGroupDataLoading } = useDoc(groupRef);

  const mealTypes = useMemo(() => groupData?.settings?.mealTypes ?? ["Breakfast", "Lunch", "Dinner"], [groupData]);
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
    
    return query(
      collection(firestore, `groups/${groupId}/meals`),
      where('userId', '==', currentUser.uid),
      where('date', '>=', dayQueryRange.start),
      where('date', '<=', dayQueryRange.end),
      orderBy('date', 'asc')
    );

  }, [currentUser, groupId, dayQueryRange]);

  const { data: loggedMeals, isLoading: areMealsLoading } = useCollection<MealLog>(mealsQuery);
  
  const mealSummary = useMemo(() => {
    const summary = mealTypes.reduce((acc: Record<string, number>, type: string) => {
        acc[normalizeMealType(type)] = 0;
        return acc;
    }, {} as Record<string, number>);

    if (loggedMeals) {
        loggedMeals.forEach(meal => {
            const type = normalizeMealType(meal.mealType);
            if (summary.hasOwnProperty(type)) {
                summary[type] += meal.mealNumber;
            }
        });
    }
    return summary;
  }, [loggedMeals, mealTypes]);

  const loggedMealTypes = useMemo(
    () => new Set((loggedMeals ?? []).map((meal) => normalizeMealType(meal.mealType))),
    [loggedMeals]
  );

  // --- End Meal Checker Logic ---


  const mealSchema = useMemo(() => {
    return z.object({
      meals: z.array(
        z.object({
          mealType: z.string().refine(
            (value) => mealTypes.includes(value),
            "Select a valid meal type."
          ).refine(
            isSafeMealType,
            "This meal type contains unsupported characters. Ask an admin to rename it."
          ),
          mealCount: z.coerce.number().positive("Meal count must be a positive number."),
          itemName: isMealItemNameRequired
            ? z.string().trim().min(1, "Item name is required.")
            : z.string().optional(),
        })
      ).min(1, "Select at least one meal type."),
    });
  }, [mealTypes, isMealItemNameRequired]);

  type MealSchemaType = z.infer<typeof mealSchema>;

  const form = useForm<MealSchemaType>({
    resolver: zodResolver(mealSchema),
    defaultValues: {
      meals: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "meals",
  });

  useEffect(() => {
    form.reset({
      meals: [],
    });
  }, [isMealItemNameRequired, mealTypes, form, selectedDate]);

  const selectedMealTypes = useMemo(
    () => new Set(fields.map((field) => field.mealType)),
    [fields]
  );

  const toggleMealType = (mealType: string, checked: boolean) => {
    if (loggedMealTypes.has(normalizeMealType(mealType))) {
      return;
    }

    const existingIndex = fields.findIndex((field) => field.mealType === mealType);

    if (checked && existingIndex === -1) {
      append({ mealType, mealCount: 1, itemName: "" });
      return;
    }

    if (!checked && existingIndex !== -1) {
      remove(existingIndex);
    }
  };

  const handleUndo = async (
    meals: Array<{ id: string; mealType: string; undoActivityId: string }>,
    loggedAt: number
  ) => {
    if (!groupId || !currentUser) return;

    if (Date.now() - loggedAt > UNDO_WINDOW_MS) {
      toast({
        variant: "destructive",
        title: "Undo time ended",
        description: "Ask an admin to correct the meal and record a reason.",
      });
      return;
    }

    try {
      const batch = writeBatch(firestore);
      const actorName = currentUser.displayName || currentUser.email?.split("@")[0] || "Member";

      meals.forEach((meal) => {
        batch.delete(doc(firestore, `groups/${groupId}/meals`, meal.id));

        const activityRef = doc(
          firestore,
          `groups/${groupId}/notifications`,
          meal.undoActivityId
        );

        batch.set(activityRef, {
          groupId,
          recordId: meal.id,
          senderId: currentUser.uid,
          senderName: actorName,
          targetUserId: currentUser.uid,
          messageText: `undid ${meal.mealType} for ${format(selectedDate, "MMM d, yyyy")}`,
          type: "meal_undo",
          createdAt: serverTimestamp(),
          readBy: [currentUser.uid],
        });
      });
      await batch.commit();

      toast({
        title: "Action Undone",
        description: `${meals.length} meal${meals.length === 1 ? "" : "s"} removed. You can log it again correctly.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Undo failed",
        description: "The meal logs could not be removed. Please try again.",
      });
      console.error("Meal undo error:", error);
    }
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
    
    const duplicateTypes = values.meals
      .map((meal) => normalizeMealType(meal.mealType))
      .filter((mealType) => loggedMealTypes.has(mealType));

    if (duplicateTypes.length > 0) {
      toast({
        variant: "destructive",
        title: "Meal already logged",
        description: "Each meal type can only be logged once per member per day.",
      });
      return;
    }

    const mealCollectionRef = collection(firestore, `groups/${groupId}/meals`);

    try {
      const actorName = currentUser.displayName || currentUser.email?.split("@")[0] || "Member";
      const dateKey = format(selectedDate, "yyyy-MM-dd");
      const mealRefs = values.meals.map((meal) =>
        doc(
          mealCollectionRef,
          getMealDocumentId(currentUser.uid, selectedDate, meal.mealType)
        )
      );

      const activityRefs = values.meals.map(() =>
        doc(collection(firestore, `groups/${groupId}/notifications`))
      );
      const undoActivityRefs = values.meals.map(() =>
        doc(collection(firestore, `groups/${groupId}/notifications`))
      );

      await runTransaction(firestore, async (transaction) => {
        const existingMeals = await Promise.all(
          mealRefs.map((mealRef) => transaction.get(mealRef))
        );

        if (existingMeals.some((mealSnapshot) => mealSnapshot.exists())) {
          throw new Error("DUPLICATE_MEAL");
        }

        values.meals.forEach((meal, index) => {
          const itemName = meal.itemName?.trim() || null;
          const normalizedMealType = normalizeMealType(meal.mealType);

          transaction.set(mealRefs[index], {
            mealType: normalizedMealType,
            mealNumber: meal.mealCount,
            description: `${meal.mealCount} ${meal.mealType}(s) logged.${itemName ? ` Item: ${itemName}` : ""}`,
            date: Timestamp.fromDate(selectedDate),
            dateKey,
            createdAt: serverTimestamp(),
            userId: currentUser.uid,
            userName: actorName,
            itemName,
            groupId,
            createdActivityId: activityRefs[index].id,
            undoActivityId: undoActivityRefs[index].id,
          });

          transaction.set(activityRefs[index], {
            groupId,
            recordId: mealRefs[index].id,
            senderId: currentUser.uid,
            senderName: actorName,
            targetUserId: currentUser.uid,
            messageText: `logged ${meal.mealType} x${meal.mealCount} for ${format(selectedDate, "MMM d, yyyy")}${itemName ? ` (${itemName})` : ""}`,
            type: "meal",
            createdAt: serverTimestamp(),
            readBy: [currentUser.uid],
          });
        });
      });

      const loggedAt = Date.now();

      toast({
        title: "Meals Logged!",
        description: `${values.meals.length} meal${values.meals.length === 1 ? "" : "s"} logged successfully.`,
        duration: UNDO_WINDOW_MS,
        action: (
          <ToastAction
            altText="Undo all meals"
            onClick={() => void handleUndo(
              mealRefs.map((mealRef, index) => ({
                id: mealRef.id,
                mealType: values.meals[index].mealType,
                undoActivityId: undoActivityRefs[index].id,
              })),
              loggedAt
            )}
          >
            Undo
          </ToastAction>
        ),
      });

      form.reset({ meals: [] });

    } catch (error) {
      const isDuplicate = error instanceof Error && error.message === "DUPLICATE_MEAL";

      toast({
        variant: "destructive",
        title: isDuplicate ? "Meal already logged" : "Error",
        description: isDuplicate
          ? "That meal type was already logged for this date. Use Undo immediately or ask an admin for a correction."
          : "Could not log the selected meals. Nothing was saved.",
      });
      console.error("Meal logging error:", error);
    }
  }
  
  if (isGroupDataLoading && groupId) {
      return (
          <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl md:text-xl"><Utensils /> Log a Meal</CardTitle>
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
        <CardTitle className="flex items-center gap-2 text-xl md:text-xl"><Utensils /> Log a Meal</CardTitle>
        <CardDescription className="text-sm md:text-base">
          Select the meal type and count for {format(selectedDate, "PPP")}.
        </CardDescription>
      </CardHeader>
      <CardContent>
         <Card className="mb-6 bg-muted/30">
            <CardHeader>
                <CardTitle className="text-base md:text-lg flex items-center gap-2"><Utensils /> Daily Meal Log</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="font-semibold mb-3 text-sm md:text-base">{format(selectedDate, "MMMM d, yyyy")}</p>
                 {areMealsLoading ? <Skeleton className="h-24 w-full" /> : 
                  mealTypes && mealTypes.length > 0 ? (
                    <div className="space-y-3">
                      {mealTypes.map((type: string) => {
                        const mealCount = mealSummary[normalizeMealType(type)] || 0;
                        const isLogged = mealCount > 0;
                        return (
                           <div key={type} className="flex items-center justify-between p-2 md:p-3 rounded-lg bg-background">
                            <span className="font-semibold capitalize text-sm md:text-base">{type}</span>
                            {isLogged ? (
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
                                    <span className="text-sm font-medium text-green-600">Logged</span>
                                    <Badge variant="secondary">x{mealCount}</Badge>
                                </div>
                            ) : (
                                <span className="text-sm text-muted-foreground">Not Logged</span>
                            )}
                           </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No meal types configured.</p>
                  )}
            </CardContent>
        </Card>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-3">
              <FormLabel>Meal Types</FormLabel>
              <p className="text-sm text-muted-foreground">
                Select every meal you want to log together.
              </p>

              <div className="grid gap-2 sm:grid-cols-2">
                {mealTypes.length > 0 ? mealTypes.map((type: string) => {
                  const isSelected = selectedMealTypes.has(type);
                  const loggedCount = mealSummary[normalizeMealType(type)] || 0;
                  const isAlreadyLogged = loggedMealTypes.has(normalizeMealType(type));

                  return (
                    <label
                      key={type}
                      className={cn(
                        "flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 transition-colors",
                        isAlreadyLogged
                          ? "cursor-not-allowed border-border bg-muted/60 opacity-75"
                          : isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border bg-background hover:bg-muted/50"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <Checkbox
                          checked={isSelected}
                          disabled={isAlreadyLogged}
                          onCheckedChange={(checked) => toggleMealType(type, checked === true)}
                        />
                        <span className="font-medium capitalize">{type}</span>
                      </span>

                      {isAlreadyLogged && (
                        <Badge variant="secondary">Already logged x{loggedCount}</Badge>
                      )}
                    </label>
                  );
                }) : (
                  <p className="text-sm text-muted-foreground">
                    No meal types configured. Ask an admin to add one.
                  </p>
                )}
              </div>

              {typeof form.formState.errors.meals?.message === "string" && (
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.meals.message}
                </p>
              )}
            </div>

            {fields.length > 0 && (
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <Card key={field.id} className="border-primary/30 bg-muted/20">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-3">
                        <CardTitle className="text-base capitalize">
                          {field.mealType}
                        </CardTitle>
                        <Badge>Selected</Badge>
                      </div>
                      <CardDescription>
                        Add the count and item for this meal.
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name={`meals.${index}.mealCount` as const}
                        render={({ field: countField }) => (
                          <FormItem>
                            <FormLabel>Meal Count</FormLabel>
                            <FormControl>
                              <Input type="number" min="0.5" step="0.25" {...countField} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`meals.${index}.itemName` as const}
                        render={({ field: itemField }) => (
                          <FormItem>
                            <FormLabel>
                              Item Name {isMealItemNameRequired ? "" : "(Optional)"}
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., Chicken Curry"
                                {...itemField}
                                value={itemField.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <Button
              type="submit"
              disabled={mealTypes.length === 0 || fields.length === 0 || form.formState.isSubmitting}
              className="w-full"
            >
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Log {fields.length || "Selected"} Meal{fields.length === 1 ? "" : "s"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
